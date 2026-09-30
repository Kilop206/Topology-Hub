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
    page.getByText("NODE::0 / 1 links incidentes", { exact: true }),
  ).toBeVisible();
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
  await page.screenshot({
    path: "test-results/topology-mobile.png",
    fullPage: true,
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir topologia", exact: true }).click();
  await expect(page).toHaveURL(/\/mine$/);
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
