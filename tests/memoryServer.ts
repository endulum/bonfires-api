import { init, close } from "../mongoose/memoryClient";

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await close();
});
