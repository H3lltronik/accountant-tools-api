export type ChatbotQueryResponse = {
  status: 'SUCCESS' | 'FAILURE' | 'ERROR' | 'NO_QUESTION_PROVIDED';
  message: string;
  metadata?: any;
};
