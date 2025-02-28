import { faker } from "@faker-js/faker";

export function randDate() {
  return faker.date.recent({ days: 7 });
}

export function bulkUsers(count: number) {
  const users: Array<{
    username: string;
    tagline: string;
    defaultNameColor?: string;
  }> = faker.helpers
    .uniqueArray(
      () =>
        faker.helpers
          .slugify(faker.color.human().concat(" ").concat(faker.animal.type()))
          .substring(0, 32),
      count
    )
    .map((u) => {
      const color = faker.helpers.maybe(faker.color.rgb, {
        probability: 0.75,
      });
      return {
        username: u,
        tagline: faker.person.bio(),
        ...(typeof color === "string" && { defaultNameColor: color }),
      };
    });
  return users;
}

export function bulkChannels(count: number) {
  const channels: Array<{
    title: string;
  }> = faker.helpers
    .uniqueArray(faker.food.dish, count)
    .map((c) => ({ title: c.substring(0, 32) }));
  return channels;
}
