import { exec } from "child_process";

async function runScript(scriptPath: string) {
    return new Promise<void>((resolve, reject) => {
        const process = exec(`tsx ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error en ${scriptPath}:`, stderr);
                reject(error);
            } else {
                console.log(`Output de ${scriptPath}:\n`, stdout);
                resolve();
            }
        });
    });
}

async function main() {
    try {
        console.log("Seed de categorías y monedas...");
        await runScript("prisma/seedCategoriesAndCurrencies.ts");

        console.log("Seed de compañías...");
        await runScript("prisma/seedCompanies.ts");

        console.log("Todos los seeds completados!");
    } catch (error) {
        console.error("Error ejecutando seeds:", error);
        process.exit(1);
    }
}

main();
