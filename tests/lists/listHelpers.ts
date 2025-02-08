/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertCode, req } from "../helpers";
import { type Response } from "supertest";

export async function assertPagination({
  reqArgs,
  expectedProperty,
  expectedTotal,
  expectedPerPage,
  perPageAssertion,
  backward = false,
}: {
  reqArgs: [string, string | null];
  expectedProperty: string; // 'communities', 'posts', whatever it'll be called
  expectedTotal: number; // expected total results
  expectedPerPage: number; // expected results per page
  perPageAssertion?: (response: Response) => void; // test to run each page
  backward?: boolean; // go backward, too?
}) {
  let response = await req(...reqArgs);
  assertCode(response, 200);
  expect(response.body).toHaveProperty(expectedProperty);
  expect(response.body).toHaveProperty("links");
  expect(response.body.links.nextPage).not.toBeNull();
  if (perPageAssertion) perPageAssertion(response);

  const mapToRecord = ({ _id }: { _id: number }) => _id;

  // keep a record of results as we page forward
  let pageCount: number = 1;
  const results: Record<number, number[]> = {
    [pageCount]: response.body[expectedProperty].map(mapToRecord),
  };

  // page forward, adding to the record
  let nextPage: string = response.body.links.nextPage;
  while (nextPage !== null) {
    response = await req(`GET ${nextPage}`, reqArgs[1]);
    assertCode(response, 200);
    if (perPageAssertion) perPageAssertion(response);
    nextPage = response.body.links.nextPage;
    pageCount++;
    results[pageCount] = response.body[expectedProperty].map(mapToRecord);
  }

  // console.log(results);

  // use record to expect a correct amount of results
  expect(
    Object.keys(results).reduce((acc: number, curr: string) => {
      return acc + results[parseInt(curr, 10)].length;
    }, 0)
  ).toEqual(expectedTotal);

  // use record to expect a correct amount of pages
  expect(pageCount).toEqual(Math.ceil(expectedTotal / expectedPerPage));

  if (backward) {
    // page backward, comparing against recorded "pages"
    let prevPage: string = response.body.links.prevPage;
    while (prevPage !== null) {
      response = await req(`GET ${prevPage}`, reqArgs[1]);
      if (perPageAssertion) perPageAssertion(response);
      prevPage = response.body.links.prevPage;
      pageCount--;
      // expect that each "page" has the exact same results
      expect(
        response.body[expectedProperty].map(({ id }: { id: number }) => id)
      ).toEqual(results[pageCount]);
    }
  }
}
