export interface ShopListing {
  shopId: string;
  itemId: string;
  locale: string;
  category: string;
  proof: string;
}

export const localeLabels: Record<string, string> = {
  en: "America",
  cs_CZ: "Czech",
  de_DE: "Germany",
  es_ES: "Spain",
  fr_FR: "France",
  hi_IN: "India",
  it_IT: "Italy",
  ja_JP: "Japan",
  ko_KR: "Korea",
  lt_LT: "Lithuania",
};

export const categoryLabels: Record<string, string> = {
  "0001": "Cosmetic",
  "0011": "Shoes",
  "0111": "Clothes",
  "1111": "Handbag",
};

export const getShopItemName = (locale: string, category: string) =>
  `${localeLabels[locale] || locale} ${categoryLabels[category] || "Product"}`;

export const shopListings: ShopListing[] = [
  {
    shopId: "148733c4-ffe9-476e-8f49-c4ced51ca5d2",
    itemId: "dbf46592-9e7e-4c48-bea7-6cf1e643ccfe",
    locale: "en",
    category: "0001",
    proof:
      "H8yUw6I6i/hNgMtRA1vrswaDa8yWlTsXK6n+ltYgR5WqFk9gr92tABFewyI/vl5MJQw1uXJxOp3yIMpXay9ZDie34g0r4/XXHP9kYB5tlB35nXxZfDWRv3dV0wytSXjriurMffuVhLmsLC0rfvQQZe+8GmfQTKPEvdMIaXILOcIAAC",
  },
  {
    shopId: "dc84e2fa-9a8b-4ae8-8cc3-c817ed54d868",
    itemId: "91266653-536b-4793-9556-995608462f69",
    locale: "cs_CZ",
    category: "0011",
    proof:
      "irMd5J0gIkJAODPOp85tmcqxfOTiimVQM/pMtf/UFTiwPxSDiRlsfY23htd4rqn8rvbjvacNZcnygYwNMjp9qiVudYfmxGXz2mLqYip7oiY7ilD64H2gTilnW3x4L6p/J4PIxg5Sh0M4umbgwkrZ7FY4iboCUIFotray5TkMKdsBAD",
  },
  {
    shopId: "5f4c641d-6882-4a38-9acd-6518c8925a52",
    itemId: "f3dfa669-3b36-41da-a05a-c57a40a77cf0",
    locale: "de_DE",
    category: "0111",
    proof:
      "LqALATQH+3RYdzyw+KN653QppUPodLEZNJtXE89YcKeIJ8WWVF4M8p05TXXxzdPtZcJcK3v54PejPADRwLmB8REcALYebL9cJfl5fXUoN/7Icp2aliowIDx77UIDiDh5r0Con5R7yJhLfnWrNqWn5a4HY2k3d0K7HuHJOSrVIDUBAE",
  },
  {
    shopId: "4960750b-923b-4059-a5a0-71e3df88c889",
    itemId: "4d1e5aa9-3cec-4a40-853a-361443d75cdf",
    locale: "es_ES",
    category: "1111",
    proof:
      "qFm5l4n6/IUO9g3YUaHnEwP+i51MYUAuuL/ztl5Mo70DbJ2SFfbrVdHHm2QJgvT1tbIjtlMW287zcTWVts76nR05gRIxOkj5CRzJ1a/IfxmoVmDAsGN89Wbx0Z8LSscNqV7Pc1DP7+qvE3MoC873Opd+7tMFYXfvKxdSGtLZL8wBAF",
  },
  {
    shopId: "6a41ddfe-f624-41b4-ac34-61ca9bcd439f",
    itemId: "8611390b-d027-4127-b304-ef4122f80872",
    locale: "fr_FR",
    category: "0001",
    proof:
      "mYPF1yOgKQZBXkqnLlzHcFBZRwk6Q1IKIEOvDZA7jzsQG3IOGGLPg+uCW1BqwwvOW1k211G1uEatN0+BAG2D4ipmUGIcQ4vXvcxM1ztdRuvgZBg5UliUig/X5J7Lc8v9IbP/DyZXCBx/OwJxB0l9OoVwjVpYh8GJENFX26VZhnYBAG",
  },
  {
    shopId: "a9dfaf51-c6a5-40d9-847a-2d309df28ca3",
    itemId: "8246bd4b-c6d3-46b7-87b0-7be83e247d36",
    locale: "hi_IN",
    category: "0011",
    proof:
      "nPsKNTjOxb0tFqVm5DY4vXWIFilo8HuC0E1yPOwwH3gMQ2822lEX0T8yVRg/8NkV4xAN41Lfxdo3wNOLTtJtqwdV/Wn76Usy1uwNwE4xGh8x7uA3CLN1vPfpgeMYGER6LU94clvno0rM0Mo1NlUqjdKZOSfl9pEn1dE4p9XmksoBAH",
  },
  {
    shopId: "48904ca2-e170-4a33-8208-5eab0029c4f3",
    itemId: "930d766b-a427-487a-b5f9-17e8792a4b54",
    locale: "it_IT",
    category: "0111",
    proof:
      "GZZ/XultahDD7w6vER3pvaAg5nB0sTQoqTroVqZboEcfdV/nOke1zsI369FxTaWECHlH+PhYpSsR9lfsknuzvB+JqRQzuPDiILqeEtZmk9LqMj11gImcEs44JAJrelpmFGl3D+1o3+iIz1VpTmFegJbhAhL4S+DlQkECkkbpfgcBAI",
  },
  {
    shopId: "66f2622d-86be-480a-9a5a-81c28530f171",
    itemId: "f003e427-64c3-40a5-b734-8f6e629992ef",
    locale: "ja_JP",
    category: "1111",
    proof:
      "pw9xCtACQC0jHfDvHJ7CFkC8bP16r20B5lWIZPZ8Wa4PavzJgTVOuwGVp2MitPEVIVqT8H1nGvfVYAXmbhApDC2AVI6GyBFstjdbWUbYIUqPgYHPXerv8m26QyebpUWFqJO32yzjFP7zVexNcZEVFpaWTey+Xi2vmfFoojqiaJsBAJ",
  },
  {
    shopId: "b01b80f1-12dd-4a3b-815d-3976bab7ea28",
    itemId: "1166710b-c69e-49b6-8166-2b59c2200440",
    locale: "ko_KR",
    category: "0001",
    proof:
      "BIsja5MSSu85HiBo1Q+HIXC6WFkQpS/jC+vdDEp7vIAomiCqystAp8oypeEANHpNMD7ycAulrcGQiCdZTuUeXAeCOPbT8GvX2JYEG6D0SWMuO4NZs2EiuYbc7ywybHvgmwtx7whmTtujSvDfcvW6Lmn0HQxFDGdD8fhBbaumdO4BAL",
  },
  {
    shopId: "33db52f7-9e1f-45b4-888f-b3122fcb3647",
    itemId: "6fcf6fc5-f481-42ca-a919-6f1de8f2cb73",
    locale: "lt_LT",
    category: "0011",
    proof:
      "hV7S4dTKC3iCN08b4l0jnph3Zm1gXqeSanxkZ+AdNi6bVhBrWGJb98PfW+4cS39KgGjJ49f7JfhRCBukPh/tRw9p+1T8bQ4vJMRURravN6dn1kv3rfp9t/0n7syuzfDtilgCIcXODi3o+TXukpHn/T+RLSyUykZkJb+Obo742mMBAM",
  },
];

export const isAllowedShopItemRoute = (
  shopId: string,
  itemId: string,
): boolean =>
  shopListings.some(
    (route) => route.shopId === shopId && route.itemId === itemId,
  );
