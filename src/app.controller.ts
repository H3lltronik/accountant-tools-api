import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatbotQueryResponse } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return 'Hello World!';
  }

  @Get('/chatbot')
  async askQuestion(
    @Query('question') question: string,
    @Query('withMeta') withMeta: string,
  ): Promise<ChatbotQueryResponse> {
    if (!question) {
      return {
        status: 'NO_QUESTION_PROVIDED',
        message: 'Please provide a question',
      };
    }

    const _withMeta = withMeta === 'true' ? true : false;
    return this.appService.askQuestion(question, _withMeta);
  }

  @Get('/similarity')
  async similarity(@Query('searchQuery') searchQuery: string) {
    return this.appService.similarity(searchQuery);
  }
}
