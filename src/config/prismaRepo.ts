import { PrismaClient } from '@prisma/client';

export default class PrismaRepo {
  static #client: PrismaClient;

  private constructor() {}

  public static get getClient(): PrismaClient {
    if (!PrismaRepo.#client) {
      PrismaRepo.#client = new PrismaClient();
    }
    return PrismaRepo.#client;
  }
}
