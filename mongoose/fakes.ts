import { faker } from "@faker-js/faker";

export type BulkUserData = {
  username: string;
  status: string;
};

export function randDate() {
  return faker.date.recent({ days: 7 });
}

export function bulkUsers(count: number): BulkUserData[] {
  const usernames: string[] = [];
  while (usernames.length < count) {
    const username = faker.color
      .human()
      .split(" ")
      .join("-")
      .concat("-")
      .concat(faker.animal.type().split(" ").join("-"));
    if (usernames.includes(username) || username.length > 32) continue;
    usernames.push(username);
  }

  const users: Array<{
    username: string;
    status: string;
  }> = usernames.map((username) => ({
    username,
    status: faker.person.bio(),
  }));

  return users;
}
