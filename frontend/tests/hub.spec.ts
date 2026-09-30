import { test, expect } from "@playwright/test";
const password = "Browser-test-password-2026";
test("cadastro, CRUD, importação e exportação funcionam pela interface", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Teste navegador");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("browser-" + Date.now() + "@test.local");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/mine$/);
  await page.getByRole("link", { name: "Nova topologia", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Rede de teste do navegador");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Cenário temporário para validar o fluxo de ponta a ponta.");
  await page.locator('input[type="file"]').setInputFiles({
    name: "rede.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        nodes: 4,
        links: [{ from: 0, to: 1, delay: 5, bandwidth: 100, loss: 0 }],
        metadata: { test: true },
      }),
    ),
  });
  await expect(
    page.getByRole("group", { name: /Prévia da topologia com 4 nós/ }),
  ).toBeVisible();
  const importedJson = await page
    .getByLabel("Topologia JSON", { exact: true })
    .inputValue();
  await page.getByLabel("Topologia JSON", { exact: true }).fill("{");
  await expect(page.getByLabel("Topologia JSON", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Salvar topologia", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Topologia JSON", { exact: true }).fill(importedJson);
  await page.screenshot({ path: "test-results/editor-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Salvar topologia", exact: true }).click();
  await expect(page).toHaveURL(/\/topologies\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Rede de teste do navegador" }),
  ).toBeVisible();
  const id = page.url().split("/").pop()!;
  await page.getByRole("link", { name: "Editar", exact: true }).click();
  await page.getByLabel("Visibilidade").selectOption("PUBLIC");
  await page.getByLabel("Nome", { exact: true }).fill("Rede revisada");
  await page.getByRole("button", { name: "Salvar topologia", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rede revisada" })).toBeVisible();
  await page.getByRole("button", { name: "Inspecionar nó 0", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("complementary", { name: "Inspector" })
      .getByRole("heading", { name: "Nó 0", exact: true }),
  ).toBeVisible();
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await expect(inspector.getByText("Links incidentes", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Inspecionar link 0 de 0 para 1", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    inspector.getByRole("heading", { name: "Link 0", exact: true }),
  ).toBeVisible();
  await expect(inspector.getByText("100 Mbps", { exact: true })).toBeVisible();
  const before = await page.locator(".graph-node circle").first().getAttribute("cx");
  await page.getByLabel("Layout do grafo").selectOption("circle");
  expect(await page.locator(".graph-node circle").first().getAttribute("cx")).not.toBe(
    before,
  );
  await page.getByRole("checkbox", { name: "IDs dos nós" }).uncheck();
  await expect(page.locator(".graph-node text")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "IDs dos nós" }).check();
  await page.getByRole("button", { name: "Aumentar zoom" }).click();
  await expect(page.getByLabel("Zoom", { exact: true })).toHaveText("140%");
  await page.getByRole("button", { name: "Redefinir visualização" }).click();
  await expect(page.getByLabel("Zoom", { exact: true })).toHaveText("100%");
  await page.getByLabel("Layout do grafo").selectOption("auto");
  await inspector.getByRole("button", { name: "Voltar à topologia" }).click();
  await page.getByRole("tab", { name: "Links", exact: true }).click();
  await expect(page.getByRole("cell", { name: "100 Mbps", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "JSON", exact: true }).click();
  await expect(page.getByRole("list", { name: "JSON da topologia" })).toBeVisible();
  await page.screenshot({ path: "test-results/topology-desktop.png", fullPage: true });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Buscar topologias" }).fill("Rede revisada");
  await expect(
    page.locator('a.topology-card[href="/topologies/' + id + '"]'),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/catalogue-desktop.png", fullPage: true });
  await page.goto("/topologies/" + id);
  const downloaded = await page.request.get("/api/topologies/" + id + "/download");
  expect(downloaded.ok()).toBeTruthy();
  expect((await downloaded.json()).metadata.test).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("link", { name: "Baixar JSON" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sair da tela cheia" })).toBeVisible();
  await page.getByRole("button", { name: "Sair da tela cheia" }).click();
  await page.screenshot({
    path: "test-results/topology-mobile.png",
    fullPage: true,
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir topologia", exact: true }).click();
  await expect(page).toHaveURL(/\/mine$/);
  await page.getByRole("button", { name: "Navegação", exact: true }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
});
test("admin controla acesso e usuário comum não recebe os controles", async ({
  page,
}) => {
  test.skip(
    !process.env.HUB_ADMIN_EMAIL || !process.env.HUB_ADMIN_PASSWORD,
    "Configure um administrador local para o teste administrativo.",
  );
  const email = "managed-" + Date.now() + "@test.local";
  const registration = await page.request.post("/api/auth/register", {
    headers: { "X-Hub-Request": "1" },
    data: { displayName: "Usuário administrado", email, password },
  });
  expect(registration.status()).toBe(201);
  const created = await registration.json();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acesso administrativo." }),
  ).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(process.env.HUB_ADMIN_EMAIL!);
  await page.getByLabel("Senha", { exact: true }).fill(process.env.HUB_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/mine$/);
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Administração", exact: true }),
  ).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: email });
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Desativar", exact: true }).click();
  await expect(row.getByText("Desativado", { exact: true })).toBeVisible();
  const me = await page.request.get("/api/admin/users");
  expect(
    (await me.json()).items.find((u: { id: string }) => u.id === created.id).active,
  ).toBe(false);
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
});
test("biblioteca e login social têm estados honestos em telas pequenas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Topology Hub", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Buscar topologias" })
    .fill("nenhum-resultado-" + Date.now());
  await expect(
    page.getByRole("heading", { name: "Nenhuma topologia encontrada." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Google indisponível" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "GitHub indisponível" })).toBeDisabled();
  await page.screenshot({
    path: "test-results/login-mobile.png",
    fullPage: true,
  });
});
test("ordenação e filtros consideram todas as páginas do repositório", async ({
  page,
}) => {
  const fixtures = Array.from({ length: 53 }, (_, index) => ({
    id: "fixture-" + index,
    title:
      index === 52 ? "A rede mais antiga" : "Z rede " + String(index).padStart(2, "0"),
    description: "Rede para validar ordenação global.",
    visibility: "PUBLIC",
    nodeCount: index + 1,
    linkCount: 0,
    ownerId: "fixture-owner",
    ownerName: "Engenharia",
    createdAt: new Date(2026, 0, 1).toISOString(),
    updatedAt: new Date(2026, 0, 53 - index).toISOString(),
    version: 0,
    metrics: {
      meanLinkDelayMs: null,
      minimumBandwidthMbps: null,
      maximumLossPercent: null,
    },
    preview: { nodes: index + 1, links: [] },
  }));
  const requestedPages: number[] = [];
  await page.route("**/api/topologies?*", (route) => {
    const query = new URL(route.request().url()).searchParams;
    const size = Number(query.get("size") || 12),
      current = Number(query.get("page") || 0);
    requestedPages.push(current);
    return route.fulfill({
      json: {
        items: fixtures.slice(current * size, (current + 1) * size),
        total: fixtures.length,
        page: current,
        size,
      },
    });
  });
  await page.goto("/");
  await expect(page.locator(".topology-card")).toHaveCount(12);
  await page.getByLabel("Ordenar topologias").selectOption("name");
  await expect(page.locator(".topology-card").first().getByRole("heading")).toHaveText(
    "A rede mais antiga",
  );
  expect(requestedPages).toContain(1);
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Mínimo de nós").fill("52");
  await expect(page.locator(".topology-card")).toHaveCount(2);
  await expect(page.getByText("2 topologias", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.locator(".topology-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(page.locator(".topology-card").first().getByRole("heading")).toHaveText(
    "Z rede 11",
  );
  await page.getByLabel("Ordenar topologias").selectOption("nodes");
  await expect(page.locator(".topology-card").first().getByRole("heading")).toHaveText(
    "A rede mais antiga",
  );
});

test("canvas mantém redes maiores, seleção por teclado e navegação de tabs", async ({
  page,
}) => {
  const graph = {
    nodes: 300,
    links: [{ from: 0, to: 299, delay: 9.8, bandwidth: 50, loss: 0.01 }],
  };
  await page.route("**/api/topologies/fixture-large", (route) =>
    route.fulfill({
      json: {
        topology: {
          id: "fixture-large",
          title: "Rede de 300 nós",
          description: "",
          visibility: "PUBLIC",
          nodeCount: 300,
          linkCount: 1,
          ownerId: "fixture",
          ownerName: "Engenharia",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          version: 0,
          metrics: {
            meanLinkDelayMs: 9.8,
            minimumBandwidthMbps: 50,
            maximumLossPercent: 1,
          },
          preview: graph,
        },
        graph,
      },
    }),
  );
  await page.goto("/topologies/fixture-large");
  await expect(page.locator(".graph-node")).toHaveCount(300);
  await page.getByRole("button", { name: "Inspecionar nó 299", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("complementary", { name: "Inspector" })
      .getByRole("heading", { name: "Nó 299" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Visão geral", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Revisões" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("heading", { name: "Revisão atual" })).toBeVisible();
  await page.setViewportSize({ width: 820, height: 1180 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("complementary", { name: "Inspector" }).locator("summary").click();
  await expect(
    page
      .getByRole("complementary", { name: "Inspector" })
      .getByRole("heading", { name: "Nó 299" }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Inspecionar link 0 de 0 para 299", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("complementary", { name: "Inspector" })
      .getByRole("heading", { name: "Link 0", exact: true }),
  ).toBeVisible();
});
