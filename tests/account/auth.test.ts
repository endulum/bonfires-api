import "../memoryServer";
import { req, assertCode, assertInputErrors } from "../helpers";
import { wipeWithAdmin } from "../../mongoose/dev";
import { User } from "../../mongoose/models/user";

let token: string = "";

beforeAll(async () => {
  await wipeWithAdmin();
});

describe("POST /login", () => {
  const correctInputs = {
    username: "admin",
    password: "password",
  };

  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: ["POST /login", null],
      correctInputs,
      wrongInputs: [
        { username: "" },
        { password: "" },
        { password: "some wrong password" },
      ],
    });
  });

  test("200 and shows token", async () => {
    const response = await req("POST /login", null, correctInputs);
    assertCode(response, 200);
    expect(response.body.token).not.toBeUndefined();
    token = response.body.token;
  });

  test("403 if token included", async () => {
    const response = await req("POST /login", token, correctInputs);
    assertCode(response, 403, "You cannot perform this action when logged in.");
  });
});

describe("POST /signup", () => {
  const correctInputs = {
    username: "new-user",
    password: "password",
    confirmPassword: "password",
  };

  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: ["POST /signup", null],
      correctInputs,
      wrongInputs: [
        { username: "" },
        { password: "" },
        { confirmPassword: "" },
        { username: "admin" },
        { password: "some mismatched password" },
        { confirmPassword: "some mismatched password" },
      ],
    });
  });

  test("200 and creates user", async () => {
    const response = await req("POST /signup", null, correctInputs);
    assertCode(response, 200);
    const user = await User.findOne({ username: correctInputs.username });
    expect(user).toBeDefined();
  });

  test("403 if token included", async () => {
    const response = await req("POST /signup", token, correctInputs);
    assertCode(response, 403, "You cannot perform this action when logged in.");
  });
});
