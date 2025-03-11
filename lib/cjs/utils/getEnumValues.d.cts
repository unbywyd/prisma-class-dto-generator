type EnumLike = Array<unknown> | Record<string, unknown>;
declare function getEnumValues<T extends EnumLike>(enumType: T): Array<string>;

export { getEnumValues };
