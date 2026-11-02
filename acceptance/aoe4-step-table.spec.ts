import { test, expect, type Page } from "@playwright/test";
import { listBuilds } from "../lib/aoe4-build-order/builds";
import { loadGameData } from "../lib/aoe4-build-order/data";
import { formatBuildOrderText } from "../lib/aoe4-build-order/parse-text";
import { buildOrderCatalog } from "../lib/aoe4-build-order/schema";
import { SIMULATE_PATH, buildOrderFrom, openPage } from "./helpers";

const row = (page: Page, i: number) => page.getByTestId("step-row").nth(i);
const field = (page: Page, i: number, name: string) =>
  row(page, i).getByTestId(`step-field-${name}`);
const textarea = (page: Page) => page.getByTestId("build-order-text");

async function openWith(page: Page, text: string) {
  await openPage(page);
  await textarea(page).fill(text);
}

const FORMS = [
  "start -> sheep",
  "produce villager from capital-town-center x3 -> sheep",
  "at 8 vils pause capital-town-center",
  "@1:30 build house from wood",
  "when wood >= 400 research fitted-leatherwork at blacksmith",
  "whenever gold runs out move all gold to gold#2",
  "at 8 vils rally capital-town-center -> gold#2",
].join("\n");

test.describe("AoE4 step table", () => {
  test("the default build renders one row per step with its first row as produce villager", async ({
    page,
  }) => {
    await openPage(page);
    const lines = (await textarea(page).inputValue())
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("start"));
    await expect(page.getByTestId("step-table")).toBeVisible();
    await expect(page.getByTestId("step-row")).toHaveCount(lines.length);
    await expect(page.getByTestId("step-table-unavailable")).toHaveCount(0);
    await expect(row(page, 0).getByTestId("step-action")).toHaveValue(
      "produce",
    );
    await expect(field(page, 0, "unit")).toHaveValue("villager");
  });

  test("table edits rewrite the text, dropping comments and blank lines and keeping start", async ({
    page,
  }) => {
    await openWith(
      page,
      "# note\nstart -> sheep\n\nproduce villager from capital-town-center\n@1:00 build house from wood",
    );
    await page.getByTestId("step-add").click();
    await expect(page.getByTestId("step-row")).toHaveCount(3);
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\nproduce villager from capital-town-center\n@1:00 build house from wood\nproduce villager from capital-town-center",
    );
    await field(page, 2, "unit").selectOption("scout");
    await expect(textarea(page)).toHaveValue(
      /\nproduce scout from capital-town-center$/,
    );
    await row(page, 2).getByTestId("step-move-up").click();
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\nproduce villager from capital-town-center\nproduce scout from capital-town-center\n@1:00 build house from wood",
    );
    await row(page, 1).getByTestId("step-delete").click();
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\nproduce villager from capital-town-center\n@1:00 build house from wood",
    );
  });

  test("typed text fills the table and is never reformatted", async ({
    page,
  }) => {
    await openPage(page);
    const typed = "start -> sheep\n\n# keep\n@1:30 build house from wood";
    await textarea(page).fill(typed);
    await expect(page.getByTestId("step-row")).toHaveCount(1);
    await expect(row(page, 0).getByTestId("step-trigger-kind")).toHaveValue(
      "time",
    );
    await expect(field(page, 0, "seconds")).toHaveValue("90");
    await expect(row(page, 0).getByTestId("step-action")).toHaveValue("build");
    await expect(field(page, 0, "building")).toHaveValue("house");
    await expect(field(page, 0, "from")).toHaveValue("wood");
    await expect(textarea(page)).toHaveValue(typed);
  });

  test("every step form shows its fields and the reaction toggle rewrites only its line", async ({
    page,
  }) => {
    await openWith(page, FORMS);
    await expect(page.getByTestId("step-row")).toHaveCount(6);
    await expect(page.getByTestId("step-field-reaction")).toHaveCount(1);
    await expect(field(page, 4, "reaction")).toBeChecked();
    await expect(field(page, 4, "count")).toHaveValue("all");
    await expect(field(page, 4, "to")).toHaveValue("gold#2");
    await expect(field(page, 5, "to")).toHaveValue("gold#2");
    await expect(row(page, 2).getByTestId("step-trigger-kind")).toHaveValue(
      "time",
    );
    await expect(row(page, 3).getByTestId("step-trigger-kind")).toHaveValue(
      "bank",
    );
    await expect(field(page, 3, "atLeast")).toHaveValue("400");
    await expect(field(page, 1, "trigger-count")).toHaveValue("8");
    await field(page, 4, "reaction").uncheck();
    await expect(textarea(page)).toHaveValue(
      FORMS.replace("whenever gold", "when gold"),
    );
  });

  test("unparsable text hides the table behind a notice naming the issue until it parses again", async ({
    page,
  }) => {
    await openWith(page, "start -> sheep\nat 8 vils fly capital-town-center");
    await expect(page.getByTestId("step-table")).toHaveCount(0);
    await expect(page.getByTestId("step-add")).toHaveCount(0);
    await expect(page.getByTestId("step-table-unavailable")).toContainText(
      "fly",
    );
    await textarea(page).fill(
      "start -> sheep\nproduce villager from capital-town-center",
    );
    await expect(page.getByTestId("step-table")).toBeVisible();
    await expect(page.getByTestId("step-table-unavailable")).toHaveCount(0);
  });

  test("values the options do not list render as unknown and the text is untouched", async ({
    page,
  }) => {
    const typed =
      "start -> sheep\nproduce spearman from town-center\nresearch not-a-tech";
    await openWith(page, typed);
    const unit = field(page, 0, "unit").locator("option:checked");
    await expect(unit).toHaveText("spearman (unknown)");
    await expect(unit).toHaveAttribute("data-unknown", "true");
    const tech = field(page, 1, "tech").locator("option:checked");
    await expect(tech).toHaveText("not-a-tech (unknown)");
    await expect(tech).toHaveAttribute("data-unknown", "true");
    await expect(textarea(page)).toHaveValue(typed);
  });

  test("number fields: optional clears, required ignores bad drafts and restores on blur", async ({
    page,
  }) => {
    await openWith(
      page,
      "start -> sheep\n@2:00 produce villager from capital-town-center x3",
    );
    const count = field(page, 0, "count");
    await count.click();
    await count.press("ControlOrMeta+a");
    await count.press("Delete");
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\n@2:00 produce villager from capital-town-center",
    );
    await count.fill("7");
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\n@2:00 produce villager from capital-town-center x7",
    );
    const before = await textarea(page).inputValue();
    const seconds = field(page, 0, "seconds");
    await seconds.fill("");
    await expect(textarea(page)).toHaveValue(before);
    await seconds.fill("abc");
    await expect(textarea(page)).toHaveValue(before);
    await seconds.blur();
    await expect(seconds).toHaveValue("120");
  });

  test("move buttons are disabled at the ends, swap rows, and deleting all rows keeps start and add", async ({
    page,
  }) => {
    await openWith(
      page,
      "start -> sheep\nproduce villager from capital-town-center\n@1:00 build house from wood",
    );
    await expect(row(page, 0).getByTestId("step-move-up")).toBeDisabled();
    await expect(row(page, 1).getByTestId("step-move-down")).toBeDisabled();
    await row(page, 1).getByTestId("step-move-up").click();
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\n@1:00 build house from wood\nproduce villager from capital-town-center",
    );
    await page.getByTestId("step-delete").first().click();
    await page.getByTestId("step-delete").first().click();
    await expect(page.getByTestId("step-row")).toHaveCount(0);
    await expect(textarea(page)).toHaveValue("start -> sheep");
    await page.getByTestId("step-add").click();
    await expect(page.getByTestId("step-row")).toHaveCount(1);
  });

  test("table buttons never post to the simulate route", async ({ page }) => {
    await openPage(page);
    let posted = false;
    page.on("request", (r) => {
      if (r.url().endsWith(SIMULATE_PATH) && r.method() === "POST")
        posted = true;
    });
    await page.getByTestId("step-add").click();
    await page.getByTestId("step-delete").first().click();
    await page.waitForTimeout(300);
    expect(posted).toBe(false);
  });

  test("after a table edit Run posts exactly the textarea text and draws the charts", async ({
    page,
  }) => {
    await openPage(page);
    await page
      .getByTestId("build-order-select")
      .selectOption(listBuilds()[0].name);
    await page.getByTestId("step-add").click();
    const request = page.waitForRequest(
      (r) => r.url().endsWith(SIMULATE_PATH) && r.method() === "POST",
    );
    await page.getByTestId("run-simulation").click();
    expect((await request).postDataJSON().buildOrder).toEqual(
      buildOrderFrom(await textarea(page).inputValue()),
    );
    await expect(page.getByTestId("chart-units-produced")).toBeVisible();
  });

  test("the rally action offers no empty target and picking options keeps the table", async ({
    page,
  }) => {
    await openWith(
      page,
      "start -> sheep\nat 8 vils rally capital-town-center -> wood",
    );
    const to = field(page, 0, "to");
    expect(
      await to
        .locator("option")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value)),
    ).not.toContain("");
    await to.selectOption("stone");
    await expect(page.getByTestId("step-table")).toBeVisible();
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\nat 8 vils rally capital-town-center -> stone",
    );
    await expect(page.getByTestId("step-table-unavailable")).toHaveCount(0);

    // the empty choice stays on the optional selects, and picking it keeps the table too
    await textarea(page).fill(
      "start -> sheep\nbuild house from wood then sheep\nproduce villager from capital-town-center -> sheep",
    );
    await field(page, 0, "then").selectOption("");
    await field(page, 1, "rally").selectOption("");
    await expect(page.getByTestId("step-table")).toBeVisible();
    await expect(textarea(page)).toHaveValue(
      "start -> sheep\nbuild house from wood\nproduce villager from capital-town-center",
    );
  });

  test("choosing the other prebuilt rewrites the table rows to that build's step lines", async ({
    page,
  }) => {
    await openPage(page);
    const select = page.getByTestId("build-order-select");
    const [first, second] = listBuilds();
    for (const build of [second, first]) {
      await select.selectOption({ label: build.name });
      await expect(page.getByTestId("step-row")).toHaveCount(
        build.steps.length,
      );
      await expect(textarea(page)).toHaveValue(formatBuildOrderText(build));
    }
    await expect(row(page, 0).getByTestId("step-action")).toHaveValue(
      first.steps[0].action,
    );
  });

  test("no row shows a raw field name once every optional field is opened", async ({
    page,
  }) => {
    await openWith(page, FORMS);
    const more = page.getByTestId("step-more");
    for (let i = 0; i < (await more.count()); i++) {
      if ((await more.nth(i).getAttribute("aria-expanded")) === "false")
        await more.nth(i).click();
    }
    const text = (await page.getByTestId("step-table").innerText());
    for (const raw of ["walkSeconds", "atLeast", "trigger-count"]) {
      expect(text).not.toContain(raw);
    }
  });

  test("the villager option reads the data name and keeps the id as its value", async ({
    page,
  }) => {
    await openWith(
      page,
      "start -> sheep\nproduce villager from capital-town-center",
    );
    const option = field(page, 0, "unit").locator("option:checked");
    await expect(option).toHaveAttribute("value", "villager");
    await expect(option).not.toHaveText("villager");
    await expect(option).toHaveText(/\S/);
  });

  test("optional fields sit behind step-more, which starts open when one is set", async ({
    page,
  }) => {
    await openWith(
      page,
      "start -> sheep\nproduce villager from capital-town-center\nproduce villager from capital-town-center x3 -> sheep",
    );
    const optional = ["instance", "count", "rally", "walkSeconds"];
    const more = row(page, 0).getByTestId("step-more");
    await expect(field(page, 0, "producer")).toBeVisible();
    await expect(field(page, 0, "unit")).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "false");
    for (const name of optional) await expect(field(page, 0, name)).toHaveCount(0);
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    for (const name of optional) await expect(field(page, 0, name)).toBeVisible();
    await more.click();
    for (const name of optional) await expect(field(page, 0, name)).toHaveCount(0);

    await expect(row(page, 1).getByTestId("step-more")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await field(page, 1, "count").press("ControlOrMeta+a");
    await field(page, 1, "count").press("Delete");
    await expect(field(page, 1, "count")).toBeVisible();

    await page.getByTestId("step-add").click();
    await expect(row(page, 2).getByTestId("step-more")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(row(page, 1).getByTestId("step-more")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await row(page, 2).getByTestId("step-more").click();
    await field(page, 2, "count").fill("2");
    await row(page, 2).getByTestId("step-action").selectOption("pause");
    await expect(row(page, 2).getByTestId("step-more")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(field(page, 2, "instance")).toHaveCount(0);
  });

  test("the reorder and delete buttons are named for assistive tech", async ({
    page,
  }) => {
    await openPage(page);
    const first = row(page, 0);
    await expect(first.getByRole("button", { name: "Move up" })).toBeVisible();
    await expect(first.getByRole("button", { name: "Move down" })).toBeVisible();
    await expect(first.getByRole("button", { name: "Delete step" })).toBeVisible();
  });

  test("the first row edits start: rally, counts, pairs, and drops the line when empty", async ({
    page,
  }) => {
    await openWith(
      page,
      "start 3 sheep 1 wood -> sheep\nproduce villager from capital-town-center",
    );
    const start = page.getByTestId("step-start-row");
    await expect(page.locator("tbody tr").first()).toHaveAttribute(
      "data-testid",
      "step-start-row",
    );
    await expect(page.getByTestId("step-row")).toHaveCount(1);
    await expect(start.getByTestId("start-field-rally")).toHaveValue("sheep");
    const counts = start.getByTestId("start-villagers-count");
    const nodes = start.getByTestId("start-villagers-node");
    await expect(counts).toHaveCount(2);
    await expect(counts.nth(0)).toHaveValue("3");
    await expect(counts.nth(1)).toHaveValue("1");
    await expect(nodes.nth(0)).toHaveValue("sheep");
    await expect(nodes.nth(1)).toHaveValue("wood");
    await expect(counts.nth(1)).toHaveAttribute("data-index", "1");
    expect(
      await nodes
        .nth(1)
        .locator("option")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value)),
    ).not.toContain("sheep");

    await counts.nth(0).fill("5");
    await expect(textarea(page)).toHaveValue(
      "start 5 sheep 1 wood -> sheep\nproduce villager from capital-town-center",
    );
    await start.getByTestId("start-field-rally").selectOption("");
    await expect(textarea(page)).toHaveValue(
      "start 5 sheep 1 wood\nproduce villager from capital-town-center",
    );
    await start.getByTestId("start-villagers-delete").first().click();
    await start.getByTestId("start-villagers-delete").first().click();
    await expect(textarea(page)).toHaveValue(
      "produce villager from capital-town-center",
    );
    await expect(start.getByTestId("start-customize")).toBeVisible();
  });

  test("customize inserts the default start, and add takes the first unused node until none is left", async ({
    page,
  }) => {
    await openWith(page, "produce villager from capital-town-center");
    const start = page.getByTestId("step-start-row");
    await expect(start.getByTestId("start-customize")).toBeVisible();
    await expect(page.locator('[data-testid^="start-field-"]')).toHaveCount(0);
    await start.getByTestId("start-customize").click();
    const catalog = buildOrderCatalog(loadGameData("english"));
    await expect(textarea(page)).toHaveValue(
      formatBuildOrderText({
        civ: "english",
        name: "x",
        steps: [
          { action: "produce", producer: "capital-town-center", unit: "villager" },
        ],
        start: catalog.defaultStart,
      }),
    );
    await expect(start.getByTestId("start-customize")).toHaveCount(0);
    await expect(start.getByTestId("start-field-rally")).toBeVisible();

    const add = start.getByTestId("start-villagers-add");
    const used = Object.keys(catalog.defaultStart.villagers ?? {});
    const free = catalog.nodes.filter((n) => !used.includes(n));
    await add.click();
    await expect(start.getByTestId("start-villagers-node").last()).toHaveValue(
      free[0],
    );
    await expect(start.getByTestId("start-villagers-count").last()).toHaveValue("1");
    for (let i = 1; i < free.length; i++) await add.click();
    await expect(add).toBeDisabled();
    await expect(page.getByTestId("step-table")).not.toContainText(
      /sum|total/i,
    );
  });

  test("the start row sits above the step rows at both widths and stacks under 768 px", async ({
    page,
  }) => {
    await openWith(
      page,
      "start 3 sheep 1 wood -> sheep\n@1:00 build house from wood",
    );
    const box = async (id: string, scope = row(page, 0)) =>
      (await scope.getByTestId(id).boundingBox())!;
    const startBox = async (id: string) =>
      (await page.getByTestId("step-start-row").getByTestId(id).first().boundingBox())!;

    await page.setViewportSize({ width: 1280, height: 900 });
    const wideTrigger = await box("step-trigger-kind");
    const wideAction = await box("step-action");
    expect(Math.abs(wideTrigger.y - wideAction.y)).toBeLessThan(4);
    const wideRally = await startBox("start-field-rally");
    const wideCount = await startBox("start-villagers-count");
    expect(Math.abs(wideRally.y - wideCount.y)).toBeLessThan(4);
    await expect(row(page, 0)).toHaveAttribute("data-step", "0");

    await page.setViewportSize({ width: 390, height: 800 });
    const narrowTrigger = await box("step-trigger-kind");
    const narrowAction = await box("step-action");
    expect(narrowAction.x).toBeCloseTo(narrowTrigger.x, 0);
    expect(narrowAction.y).toBeGreaterThan(narrowTrigger.y);
    const narrowRally = await startBox("start-field-rally");
    const narrowCount = await startBox("start-villagers-count");
    expect(narrowCount.y).toBeGreaterThan(narrowRally.y);
    await expect(row(page, 0)).toHaveAttribute("data-step", "0");

    await field(page, 0, "building").selectOption("barracks");
    await expect(textarea(page)).toHaveValue(
      "start 3 sheep 1 wood -> sheep\n@1:00 build barracks from wood",
    );
  });
});
