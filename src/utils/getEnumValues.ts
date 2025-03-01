type EnumLike = Array<unknown> | Record<string, unknown>;
export function getEnumValues<T extends EnumLike>(enumType: T): Array<string> {
    return Array.from(
        new Set(
            Object.keys(enumType)
                .filter((key) => isNaN(Number(key))) // Оставляем только строковые ключи
                .map((key) => (enumType as any)[key]) // Получаем значения из enum
                .filter((value): value is string => typeof value === 'string') // Убираем нестроковые значения
        )
    );
}