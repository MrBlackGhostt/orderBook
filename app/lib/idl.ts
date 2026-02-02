export type OrderbookDex = {
  address: "Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg";
  metadata: {
    name: "orderbook_dex";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "cancel_order";
      discriminator: [95, 129, 237, 240, 8, 49, 223, 132];
      accounts: [
        { name: "trader"; writable: true; signer: true },
        { name: "market"; writable: true },
        { name: "base_mint"; writable: true },
        { name: "quote_mint"; writable: true },
        { name: "order_book"; writable: true },
        { name: "base_mint_vault"; writable: true },
        { name: "quote_mint_vault"; writable: true },
        { name: "trader_base_mint_account"; writable: true },
        { name: "trader_quote_mint_account"; writable: true },
        { name: "token_program" }
      ];
      args: [
        { name: "side"; type: { defined: { name: "Side" } } },
        { name: "order_id"; type: "u64" }
      ];
    },
    {
      name: "create_market";
      discriminator: [103, 226, 97, 235, 200, 188, 251, 254];
      accounts: [
        { name: "market_signer"; writable: true; signer: true },
        { name: "base_mint"; writable: true },
        { name: "quote_mint"; writable: true },
        { name: "market"; writable: true },
        { name: "order_book"; writable: true },
        { name: "base_mint_vault"; writable: true },
        { name: "quote_vault"; writable: true },
        { name: "token_program" },
        { name: "associated_token_program" },
        { name: "system_program" }
      ];
      args: [{ name: "fee_bps"; type: "u16" }];
    },
    {
      name: "match_order";
      discriminator: [95, 230, 21, 6, 114, 23, 41, 111];
      accounts: [
        { name: "cranker"; writable: true; signer: true },
        { name: "base_mint" },
        { name: "quote_mint" },
        { name: "base_mint_vault"; writable: true },
        { name: "quote_mint_vault"; writable: true },
        { name: "market"; writable: true },
        { name: "order_book"; writable: true },
        { name: "fee_collector"; writable: true },
        { name: "token_program" }
      ];
      args: [];
    },
    {
      name: "place_order";
      discriminator: [51, 194, 155, 175, 109, 130, 96, 106];
      accounts: [
        { name: "trader"; writable: true; signer: true },
        { name: "market"; writable: true },
        { name: "base_mint"; writable: true },
        { name: "quote_mint"; writable: true },
        { name: "token_program" },
        { name: "base_mint_vault"; writable: true },
        { name: "quote_mint_vault"; writable: true },
        { name: "trader_base_mint_account"; writable: true },
        { name: "trader_quote_mint_account"; writable: true },
        { name: "order_book"; writable: true },
        { name: "system_program" },
        { name: "associated_token_program" }
      ];
      args: [
        { name: "price"; type: "u64" },
        { name: "amount"; type: "u64" },
        { name: "side"; type: { defined: { name: "Side" } } }
      ];
    }
  ];
  accounts: [
    { name: "Market"; discriminator: [219, 190, 213, 55, 0, 227, 198, 154] },
    { name: "OrderBook"; discriminator: [55, 230, 125, 218, 149, 39, 65, 248] }
  ];
  errors: [
    { code: 6000; name: "OrderBookFull"; msg: "OrderBook is full" },
    {
      code: 6001;
      name: "ErrorInMultiply";
      msg: "Error in calculating the Bid Amount";
    },
    { code: 6002; name: "ErrorValueInvalid"; msg: "Enter Valid Value" },
    { code: 6003; name: "InvalidAta"; msg: "The Ata is invalid" },
    { code: 6004; name: "AtaNotFound"; msg: "The Ata not found" }
  ];
  types: [
    {
      name: "LimitOrder";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "pubkey" },
          { name: "price"; type: "u64" },
          { name: "amount"; type: "u64" },
          { name: "order_id"; type: "u64" }
        ];
      };
    },
    {
      name: "Market";
      type: {
        kind: "struct";
        fields: [
          { name: "base_mint"; type: "pubkey" },
          { name: "quote_mint"; type: "pubkey" },
          { name: "base_vault"; type: "pubkey" },
          { name: "quote_vault"; type: "pubkey" },
          { name: "fee_bps"; type: "u16" },
          { name: "creator"; type: "pubkey" }
        ];
      };
    },
    {
      name: "OrderBook";
      type: {
        kind: "struct";
        fields: [
          { name: "market"; type: "pubkey" },
          { name: "next_order_id"; type: "u64" },
          { name: "bids"; type: { vec: { defined: { name: "LimitOrder" } } } },
          { name: "asks"; type: { vec: { defined: { name: "LimitOrder" } } } }
        ];
      };
    },
    {
      name: "Side";
      type: {
        kind: "enum";
        variants: [{ name: "Bid" }, { name: "Ask" }];
      };
    }
  ];
};

export const IDL: OrderbookDex = {
  address: "Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg",
  metadata: {
    name: "orderbook_dex",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "cancel_order",
      discriminator: [95, 129, 237, 240, 8, 49, 223, 132],
      accounts: [
        { name: "trader", writable: true, signer: true },
        { name: "market", writable: true },
        { name: "base_mint", writable: true },
        { name: "quote_mint", writable: true },
        { name: "order_book", writable: true },
        { name: "base_mint_vault", writable: true },
        { name: "quote_mint_vault", writable: true },
        { name: "trader_base_mint_account", writable: true },
        { name: "trader_quote_mint_account", writable: true },
        { name: "token_program" },
      ],
      args: [
        { name: "side", type: { defined: { name: "Side" } } },
        { name: "order_id", type: "u64" },
      ],
    },
    {
      name: "create_market",
      discriminator: [103, 226, 97, 235, 200, 188, 251, 254],
      accounts: [
        { name: "market_signer", writable: true, signer: true },
        { name: "base_mint", writable: true },
        { name: "quote_mint", writable: true },
        { name: "market", writable: true },
        { name: "order_book", writable: true },
        { name: "base_mint_vault", writable: true },
        { name: "quote_vault", writable: true },
        { name: "token_program" },
        { name: "associated_token_program" },
        { name: "system_program" },
      ],
      args: [{ name: "fee_bps", type: "u16" }],
    },
    {
      name: "match_order",
      discriminator: [95, 230, 21, 6, 114, 23, 41, 111],
      accounts: [
        { name: "cranker", writable: true, signer: true },
        { name: "base_mint" },
        { name: "quote_mint" },
        { name: "base_mint_vault", writable: true },
        { name: "quote_mint_vault", writable: true },
        { name: "market", writable: true },
        { name: "order_book", writable: true },
        { name: "fee_collector", writable: true },
        { name: "token_program" },
      ],
      args: [],
    },
    {
      name: "place_order",
      discriminator: [51, 194, 155, 175, 109, 130, 96, 106],
      accounts: [
        { name: "trader", writable: true, signer: true },
        { name: "market", writable: true },
        { name: "base_mint", writable: true },
        { name: "quote_mint", writable: true },
        { name: "token_program" },
        { name: "base_mint_vault", writable: true },
        { name: "quote_mint_vault", writable: true },
        { name: "trader_base_mint_account", writable: true },
        { name: "trader_quote_mint_account", writable: true },
        { name: "order_book", writable: true },
        { name: "system_program" },
        { name: "associated_token_program" },
      ],
      args: [
        { name: "price", type: "u64" },
        { name: "amount", type: "u64" },
        { name: "side", type: { defined: { name: "Side" } } },
      ],
    },
  ],
  accounts: [
    { name: "Market", discriminator: [219, 190, 213, 55, 0, 227, 198, 154] },
    { name: "OrderBook", discriminator: [55, 230, 125, 218, 149, 39, 65, 248] },
  ],
  errors: [
    { code: 6000, name: "OrderBookFull", msg: "OrderBook is full" },
    {
      code: 6001,
      name: "ErrorInMultiply",
      msg: "Error in calculating the Bid Amount",
    },
    { code: 6002, name: "ErrorValueInvalid", msg: "Enter Valid Value" },
    { code: 6003, name: "InvalidAta", msg: "The Ata is invalid" },
    { code: 6004, name: "AtaNotFound", msg: "The Ata not found" },
  ],
  types: [
    {
      name: "LimitOrder",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "pubkey" },
          { name: "price", type: "u64" },
          { name: "amount", type: "u64" },
          { name: "order_id", type: "u64" },
        ],
      },
    },
    {
      name: "Market",
      type: {
        kind: "struct",
        fields: [
          { name: "base_mint", type: "pubkey" },
          { name: "quote_mint", type: "pubkey" },
          { name: "base_vault", type: "pubkey" },
          { name: "quote_vault", type: "pubkey" },
          { name: "fee_bps", type: "u16" },
          { name: "creator", type: "pubkey" },
        ],
      },
    },
    {
      name: "OrderBook",
      type: {
        kind: "struct",
        fields: [
          { name: "market", type: "pubkey" },
          { name: "next_order_id", type: "u64" },
          { name: "bids", type: { vec: { defined: { name: "LimitOrder" } } } },
          { name: "asks", type: { vec: { defined: { name: "LimitOrder" } } } },
        ],
      },
    },
    {
      name: "Side",
      type: {
        kind: "enum",
        variants: [{ name: "Bid" }, { name: "Ask" }],
      },
    },
  ],
};
