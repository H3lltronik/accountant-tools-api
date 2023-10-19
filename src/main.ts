import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { config } from 'dotenv';
import { AppModule } from './app.module';
config();

let server: Handler;

async function bootstrapLambdaApp(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

async function bootstrapServerApp(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}

export const lambdaHandler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  server = server ?? (await bootstrapLambdaApp());
  return server(event, context, callback);
};

if (process.env.APP_TYPE === 'server') {
  bootstrapServerApp();
}
