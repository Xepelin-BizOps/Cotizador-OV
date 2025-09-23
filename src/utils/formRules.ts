// Reglas que se usan en todos los formularios

export const requiredRule = {
    required: true,
    message: "Campo obligatorio",
} as const;

export const emailRule = {
    type: "email",
    message: "El correo no es válido",
} as const;

export const phoneRule = {
    pattern: /^\d{10}$/,
    message: "El número debe tener 10 dígitos",
} as const;
