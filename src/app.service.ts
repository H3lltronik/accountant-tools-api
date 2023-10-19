import { Injectable } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { config } from 'dotenv';
import { RetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { ChatbotQueryResponse } from './types';
config();

const client = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
  environment: process.env.PINECONE_ENVIRONMENT as string,
});
const pineconeIndex = client.Index(process.env.PINECONE_INDEX_NAME as string);

const model = new OpenAI({
  openAIApiKey: process.env.OPEN_AI_API_KEY as string,
  temperature: Number(process.env.OPEN_AI_MODEL_TEMPERATURE),
  modelName: process.env.OPEN_AI_MODEL_NAME as string,
});

@Injectable()
export class AppService {
  async askQuestion(
    userQuery: string,
    withMeta: boolean,
  ): Promise<ChatbotQueryResponse> {
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        pineconeIndex,
      },
    );
    const retriever = vectorStore.asRetriever({ k: 2 });

    const template = `
      Use the following pieces of context to answer the question at the end.
      If you don't know the answer, just say that you don't know, don't try to make up an answer.
      Use three sentences maximum and keep the answer as concise as possible.
      Important: Respond in spanish.
      {context}
      Question: {question}
      Helpful Answer:`;
    const QA_CHAIN_PROMPT = new PromptTemplate({
      inputVariables: ['context', 'question'],
      template,
    });

    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(model, {
        prompt: QA_CHAIN_PROMPT,
      }),
      retriever,
      returnSourceDocuments: true,
      inputKey: 'question',
    });

    try {
      const query = async (text: string) => {
        const response = await chain.call({ question: text });
        return response;
      };

      const message = await query(userQuery);
      const result: ChatbotQueryResponse = {
        status: 'SUCCESS',
        message: message.text,
      };

      if (withMeta) result.metadata = message;

      return result;
    } catch (error) {
      console.error(error);
      return {
        status: 'ERROR',
        message: 'Something went wrong',
      };
    }
  }

  async similarity(searchQuery: string) {
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        pineconeIndex,
      },
    );

    const results = await vectorStore.similaritySearch(searchQuery, 1);
    return { results };
  }
}
