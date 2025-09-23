/* eslint-disable prefer-const */
interface Config {
    DATABASE_URL: string
    JWT_SECRET: string
    NEXT_PUBLIC_ALLOWED_ORIGINS?: string
}

interface SecretsFromAWS {
    DATABASE_URL: string
    JWT_SECRET: string
    NEXT_PUBLIC_ALLOWED_ORIGINS?: string
}

export function getConfig(): Config {
    // Si existe APP_SECRETS (AWS App Runner con Secrets Manager)
    if (process.env.APP_SECRETS && process.env.NODE_ENV === 'production') {
        try {
            const secrets: SecretsFromAWS = JSON.parse(process.env.APP_SECRETS)
            return {
                DATABASE_URL: secrets.DATABASE_URL,
                JWT_SECRET: secrets.JWT_SECRET,
                NEXT_PUBLIC_ALLOWED_ORIGINS: secrets.NEXT_PUBLIC_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_ALLOWED_ORIGINS
            }
        } catch (error) {
            console.error('Error al parsear APP_SECRETS:', error)
            throw new Error('Error al parsear aws secrets')
        }
    }

    // Desarrollo local
    return {
        DATABASE_URL: process.env.DATABASE_URL!,
        JWT_SECRET: process.env.JWT_SECRET!,
        NEXT_PUBLIC_ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS
    }
}

// Exportar config validado
export let config: Config = getConfig();