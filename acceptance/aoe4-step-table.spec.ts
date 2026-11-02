import { test, expect, type Page } from "@playwright/test";
import { listBuilds } from "../lib/aoe4-build-order/builds";
import { formatBuildOrderText } from "../lib/aoe4-build-order/parse-text";
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
});
