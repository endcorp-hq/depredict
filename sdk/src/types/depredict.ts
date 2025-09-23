/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/depredict.json`.
 */
export type Depredict = {
  "address": "FMG8WchQ4AxEirv5nYcVeBoPQfgrwTBqhD2q7mGMvb33",
  "metadata": {
    "name": "depredict",
    "version": "0.6.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeConfig",
      "discriminator": [
        145,
        9,
        72,
        157,
        95,
        125,
        61,
        85
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeMarket",
      "discriminator": [
        88,
        154,
        248,
        186,
        48,
        14,
        123,
        244
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocolFeeVault",
          "writable": true
        },
        {
          "name": "config",
          "writable": true
        },
        {
          "name": "protocolFeeVaultAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "protocolFeeVault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "creatorFeeVaultAta",
          "writable": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "args.market_id"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "closeMarketArgs"
            }
          }
        }
      ]
    },
    {
      "name": "closePositionPage",
      "discriminator": [
        21,
        251,
        16,
        39,
        106,
        129,
        121,
        74
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              }
            ]
          }
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "positionPage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              },
              {
                "kind": "arg",
                "path": "args.page_index"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "closePositionPageArgs"
            }
          }
        }
      ]
    },
    {
      "name": "createMarket",
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "config.next_market_id",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "positionPage0",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "config.next_market_id",
                "account": "config"
              },
              {
                "kind": "const",
                "value": [
                  0,
                  0
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "oraclePubkey",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createMarketArgs"
            }
          }
        }
      ]
    },
    {
      "name": "createMarketCreator",
      "discriminator": [
        36,
        217,
        249,
        181,
        83,
        11,
        163,
        241
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketCreator",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  95,
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createMarketCreatorArgs"
            }
          }
        }
      ]
    },
    {
      "name": "ensurePositionPage",
      "discriminator": [
        40,
        194,
        168,
        152,
        36,
        160,
        143,
        126
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              }
            ]
          }
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "positionPage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              },
              {
                "kind": "arg",
                "path": "args.page_index"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "ensurePageArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeVault",
          "writable": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeAmount",
          "type": "u16"
        }
      ]
    },
    {
      "name": "openPosition",
      "discriminator": [
        135,
        128,
        47,
        77,
        15,
        152,
        240,
        49
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "positionPage",
          "docs": [
            "current page PDA; program verifies/derives and uses it"
          ],
          "writable": true
        },
        {
          "name": "positionPageNext",
          "docs": [
            "next page PDA; program verifies/derives and must be pre-created by authority"
          ],
          "writable": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              }
            ]
          }
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "userMintAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "merkleTree",
          "writable": true
        },
        {
          "name": "collection",
          "writable": true
        },
        {
          "name": "treeConfig",
          "writable": true
        },
        {
          "name": "mplCoreCpiSigner",
          "writable": true
        },
        {
          "name": "mplCoreProgram",
          "address": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
        },
        {
          "name": "bubblegumProgram",
          "address": "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"
        },
        {
          "name": "logWrapperProgram"
        },
        {
          "name": "compressionProgram"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "openPositionArgs"
            }
          }
        }
      ]
    },
    {
      "name": "prunePosition",
      "discriminator": [
        105,
        225,
        154,
        128,
        215,
        31,
        56,
        58
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              }
            ]
          }
        },
        {
          "name": "marketCreator"
        },
        {
          "name": "positionPage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              },
              {
                "kind": "arg",
                "path": "args.page_index"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "prunePositionArgs"
            }
          }
        }
      ]
    },
    {
      "name": "resolveMarket",
      "discriminator": [
        155,
        23,
        80,
        173,
        46,
        74,
        23,
        239
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "marketCreator",
          "docs": [
            "Market creator account that owns this market"
          ]
        },
        {
          "name": "oraclePubkey",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "resolveMarketArgs"
            }
          }
        }
      ]
    },
    {
      "name": "settlePosition",
      "discriminator": [
        33,
        156,
        74,
        218,
        215,
        42,
        112,
        175
      ],
      "accounts": [
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "marketCreator"
        },
        {
          "name": "positionPage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "marketState"
              },
              {
                "kind": "arg",
                "path": "args.page_index"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "claimerMintAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "claimer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mplCoreProgram",
          "address": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
        },
        {
          "name": "bubblegumProgram",
          "address": "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "merkleTree",
          "writable": true
        },
        {
          "name": "collection",
          "writable": true
        },
        {
          "name": "treeConfig",
          "writable": true
        },
        {
          "name": "mplCoreCpiSigner",
          "writable": true
        },
        {
          "name": "logWrapperProgram"
        },
        {
          "name": "compressionProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "settlePositionArgs"
            }
          }
        }
      ]
    },
    {
      "name": "updateAuthority",
      "discriminator": [
        32,
        46,
        64,
        28,
        149,
        75,
        243,
        88
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeVault",
          "writable": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "authority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateBaseUri",
      "discriminator": [
        124,
        52,
        206,
        52,
        58,
        207,
        42,
        158
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeVault",
          "writable": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "baseUri",
          "type": {
            "array": [
              "u8",
              200
            ]
          }
        }
      ]
    },
    {
      "name": "updateCreatorFee",
      "discriminator": [
        177,
        106,
        220,
        56,
        30,
        10,
        207,
        216
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "creatorFee",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateCreatorFeeVault",
      "discriminator": [
        23,
        113,
        60,
        1,
        111,
        180,
        206,
        210
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "currentFeeVault",
          "type": "pubkey"
        },
        {
          "name": "newFeeVault",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateCreatorName",
      "discriminator": [
        234,
        179,
        252,
        154,
        161,
        197,
        161,
        137
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateFeeAmount",
      "discriminator": [
        42,
        132,
        206,
        131,
        241,
        110,
        113,
        96
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeVault",
          "writable": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeAmount",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateFeeVault",
      "discriminator": [
        186,
        252,
        216,
        197,
        126,
        152,
        213,
        9
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeVault",
          "writable": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeVault",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateMarket",
      "discriminator": [
        153,
        39,
        2,
        197,
        179,
        50,
        199,
        217
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateMarketArgs"
            }
          }
        }
      ]
    },
    {
      "name": "updateMerkleTree",
      "discriminator": [
        194,
        0,
        229,
        7,
        77,
        132,
        220,
        104
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "merkleTree",
          "writable": true
        },
        {
          "name": "treeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "merkleTree"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                152,
                139,
                128,
                235,
                121,
                53,
                40,
                105,
                178,
                36,
                116,
                95,
                89,
                221,
                191,
                138,
                38,
                88,
                202,
                19,
                220,
                104,
                129,
                33,
                38,
                53,
                28,
                174,
                7,
                193,
                165,
                165
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newTree",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "verifyMarketCreator",
      "discriminator": [
        160,
        239,
        175,
        141,
        158,
        216,
        78,
        151
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketCreator",
          "writable": true
        },
        {
          "name": "coreCollection"
        },
        {
          "name": "merkleTree"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "verifyMarketCreatorArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "marketCreator",
      "discriminator": [
        99,
        10,
        205,
        188,
        129,
        140,
        47,
        242
      ]
    },
    {
      "name": "marketState",
      "discriminator": [
        0,
        125,
        123,
        215,
        95,
        96,
        164,
        194
      ]
    },
    {
      "name": "positionPage",
      "discriminator": [
        31,
        167,
        64,
        181,
        48,
        132,
        114,
        152
      ]
    }
  ],
  "events": [
    {
      "name": "marketEvent",
      "discriminator": [
        212,
        67,
        145,
        23,
        58,
        104,
        52,
        83
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized Instruction"
    },
    {
      "code": 6001,
      "name": "configInUse",
      "msg": "Config account in use, cannot close it"
    },
    {
      "code": 6002,
      "name": "sameFeeAmount",
      "msg": "Same fee amount"
    },
    {
      "code": 6003,
      "name": "invalidFeeAmount",
      "msg": "Invalid fee amount"
    },
    {
      "code": 6004,
      "name": "sameFeeVault",
      "msg": "Same fee vault"
    },
    {
      "code": 6005,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6006,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6007,
      "name": "invalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6008,
      "name": "noAvailablePositionSlot",
      "msg": "No available position slot"
    },
    {
      "code": 6009,
      "name": "invalidOracle",
      "msg": "Invalid oracle"
    },
    {
      "code": 6010,
      "name": "oracleNotResolved",
      "msg": "Oracle not resolved"
    },
    {
      "code": 6011,
      "name": "marketInactive",
      "msg": "Market is inactive"
    },
    {
      "code": 6012,
      "name": "invalidBettingStart",
      "msg": "Invalid betting start"
    },
    {
      "code": 6013,
      "name": "positionNotFound",
      "msg": "Position not found"
    },
    {
      "code": 6014,
      "name": "bettingPeriodNotStarted",
      "msg": "Betting period not started"
    },
    {
      "code": 6015,
      "name": "bettingPeriodExceeded",
      "msg": "Betting period exceeded"
    },
    {
      "code": 6016,
      "name": "bettingPeriodEnded",
      "msg": "Betting period ended"
    },
    {
      "code": 6017,
      "name": "marketStillActive",
      "msg": "Market still active"
    },
    {
      "code": 6018,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity"
    },
    {
      "code": 6019,
      "name": "marketNotResolved",
      "msg": "Market not resolved"
    },
    {
      "code": 6020,
      "name": "marketAlreadyResolved",
      "msg": "Market already resolved"
    },
    {
      "code": 6021,
      "name": "concurrentTransaction",
      "msg": "Concurrent transaction"
    },
    {
      "code": 6022,
      "name": "marketNotAllowedToPayout",
      "msg": "Market Not allowed to payout"
    },
    {
      "code": 6023,
      "name": "userTradeIsSubUser",
      "msg": "User trade is sub user"
    },
    {
      "code": 6024,
      "name": "prizeNotFound",
      "msg": "Prize not found"
    },
    {
      "code": 6025,
      "name": "noPrizesAvailable",
      "msg": "No Prize Available"
    },
    {
      "code": 6026,
      "name": "alreadyLinked",
      "msg": "Already linked"
    },
    {
      "code": 6027,
      "name": "notLinked",
      "msg": "Not linked"
    },
    {
      "code": 6028,
      "name": "invalidCustomer",
      "msg": "Invalid customer"
    },
    {
      "code": 6029,
      "name": "invalidMint",
      "msg": "Invalid mint"
    },
    {
      "code": 6030,
      "name": "invalidFeeVault",
      "msg": "Invalid fee vault"
    },
    {
      "code": 6031,
      "name": "invalidShares",
      "msg": "Invalid shares"
    },
    {
      "code": 6032,
      "name": "unauthorizedToOrderBook",
      "msg": "Unauthorized to order book"
    },
    {
      "code": 6033,
      "name": "orderIsFullFilled",
      "msg": "Order is full filled"
    },
    {
      "code": 6034,
      "name": "overflow",
      "msg": "overflow"
    },
    {
      "code": 6035,
      "name": "marketAlreadyAggregated",
      "msg": "Market already aggregated"
    },
    {
      "code": 6036,
      "name": "invalidMarketId",
      "msg": "Invalid market id"
    },
    {
      "code": 6037,
      "name": "invalidCollection",
      "msg": "Invalid collection"
    },
    {
      "code": 6038,
      "name": "invalidCollectionMint",
      "msg": "Invalid collection mint"
    },
    {
      "code": 6039,
      "name": "invalidAuthority",
      "msg": "Invalid collection authority"
    },
    {
      "code": 6040,
      "name": "invalidMplCoreProgram",
      "msg": "Invalid mpl core program"
    },
    {
      "code": 6041,
      "name": "invalidNft",
      "msg": "Invalid NFT"
    },
    {
      "code": 6042,
      "name": "marketCreatorInactive",
      "msg": "Market creator is inactive"
    },
    {
      "code": 6043,
      "name": "invalidProgram",
      "msg": "Invalid program"
    },
    {
      "code": 6044,
      "name": "invalidTree",
      "msg": "Invalid tree"
    },
    {
      "code": 6045,
      "name": "alreadyVerified",
      "msg": "Market creator already verified"
    },
    {
      "code": 6046,
      "name": "invalidMarketCreator",
      "msg": "Invalid market creator"
    },
    {
      "code": 6047,
      "name": "positionNotPrunable",
      "msg": "Position not prunable (must be Claimed or Closed)"
    },
    {
      "code": 6048,
      "name": "positionPageNotEmpty",
      "msg": "Position page not empty"
    },
    {
      "code": 6049,
      "name": "invalidFeeBps",
      "msg": "Invalid fee bps"
    }
  ],
  "types": [
    {
      "name": "closeMarketArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "closePositionPageArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pageIndex",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "feeVault",
            "type": "pubkey"
          },
          {
            "name": "feeAmount",
            "type": "u16"
          },
          {
            "name": "version",
            "type": "u16"
          },
          {
            "name": "nextMarketId",
            "type": "u64"
          },
          {
            "name": "globalMarkets",
            "type": "u64"
          },
          {
            "name": "baseUri",
            "type": {
              "array": [
                "u8",
                200
              ]
            }
          }
        ]
      }
    },
    {
      "name": "createMarketArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "question",
            "type": {
              "array": [
                "u8",
                80
              ]
            }
          },
          {
            "name": "marketType",
            "type": {
              "defined": {
                "name": "marketType"
              }
            }
          },
          {
            "name": "bettingStart",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "marketStart",
            "type": "i64"
          },
          {
            "name": "marketEnd",
            "type": "i64"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "oracleType",
            "type": {
              "defined": {
                "name": "oracleType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "createMarketCreatorArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "feeVault",
            "type": "pubkey"
          },
          {
            "name": "creatorFeeBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "ensurePageArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pageIndex",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "marketCreator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "coreCollection",
            "type": "pubkey"
          },
          {
            "name": "merkleTree",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "numMarkets",
            "type": "u64"
          },
          {
            "name": "activeMarkets",
            "type": "u8"
          },
          {
            "name": "pagesAllocated",
            "type": "u16"
          },
          {
            "name": "feeVault",
            "type": "pubkey"
          },
          {
            "name": "creatorFeeBps",
            "type": "u16"
          },
          {
            "name": "verified",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "marketEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketCreator",
            "type": "pubkey"
          },
          {
            "name": "marketId",
            "type": "u64"
          },
          {
            "name": "yesLiquidity",
            "type": "u64"
          },
          {
            "name": "noLiquidity",
            "type": "u64"
          },
          {
            "name": "volume",
            "type": "u64"
          },
          {
            "name": "updateTs",
            "type": "i64"
          },
          {
            "name": "nextPositionId",
            "type": "u64"
          },
          {
            "name": "marketState",
            "type": {
              "defined": {
                "name": "marketStates"
              }
            }
          },
          {
            "name": "marketStart",
            "type": "i64"
          },
          {
            "name": "marketEnd",
            "type": "i64"
          },
          {
            "name": "question",
            "type": {
              "array": [
                "u8",
                80
              ]
            }
          },
          {
            "name": "winningDirection",
            "type": {
              "defined": {
                "name": "winningDirection"
              }
            }
          }
        ]
      }
    },
    {
      "name": "marketState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "marketId",
            "type": "u64"
          },
          {
            "name": "marketCreator",
            "type": "pubkey"
          },
          {
            "name": "marketType",
            "type": {
              "defined": {
                "name": "marketType"
              }
            }
          },
          {
            "name": "oracleType",
            "type": {
              "defined": {
                "name": "oracleType"
              }
            }
          },
          {
            "name": "oraclePubkey",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "nftCollection",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "mint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "marketVault",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "yesLiquidity",
            "type": "u64"
          },
          {
            "name": "noLiquidity",
            "type": "u64"
          },
          {
            "name": "volume",
            "type": "u64"
          },
          {
            "name": "updateTs",
            "type": "i64"
          },
          {
            "name": "padding1",
            "type": {
              "array": [
                "u8",
                7
              ]
            }
          },
          {
            "name": "nextPositionId",
            "type": "u64"
          },
          {
            "name": "pagesAllocated",
            "type": "u32"
          },
          {
            "name": "marketState",
            "type": {
              "defined": {
                "name": "marketStates"
              }
            }
          },
          {
            "name": "bettingStart",
            "type": "i64"
          },
          {
            "name": "marketStart",
            "type": "i64"
          },
          {
            "name": "marketEnd",
            "type": "i64"
          },
          {
            "name": "question",
            "type": {
              "array": [
                "u8",
                80
              ]
            }
          },
          {
            "name": "winningDirection",
            "type": {
              "defined": {
                "name": "winningDirection"
              }
            }
          },
          {
            "name": "version",
            "type": "u64"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                20
              ]
            }
          }
        ]
      }
    },
    {
      "name": "marketStates",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "ended"
          },
          {
            "name": "resolving"
          },
          {
            "name": "resolved"
          }
        ]
      }
    },
    {
      "name": "marketType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "live"
          },
          {
            "name": "future"
          }
        ]
      }
    },
    {
      "name": "openPositionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "positionDirection"
              }
            }
          },
          {
            "name": "metadataUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "oracleType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "switchboard"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "assetId",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "positionDirection"
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "positionStatus"
              }
            }
          },
          {
            "name": "positionId",
            "type": "u64"
          },
          {
            "name": "leafIndex",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "yes"
          },
          {
            "name": "no"
          }
        ]
      }
    },
    {
      "name": "positionPage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "marketId",
            "type": "u64"
          },
          {
            "name": "pageIndex",
            "type": "u16"
          },
          {
            "name": "count",
            "type": "u8"
          },
          {
            "name": "prewarmNext",
            "type": "bool"
          },
          {
            "name": "entries",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "position"
                  }
                },
                16
              ]
            }
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                5
              ]
            }
          }
        ]
      }
    },
    {
      "name": "positionStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "init"
          },
          {
            "name": "open"
          },
          {
            "name": "closed"
          },
          {
            "name": "claimed"
          }
        ]
      }
    },
    {
      "name": "prunePositionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pageIndex",
            "type": "u16"
          },
          {
            "name": "slotIndex",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "resolveMarketArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oracleValue",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "settlePositionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pageIndex",
            "type": "u16"
          },
          {
            "name": "slotIndex",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "assetId",
            "type": "pubkey"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "dataHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "creatorHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "leafIndex",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "updateMarketArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketEnd",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "marketState",
            "type": {
              "option": {
                "defined": {
                  "name": "marketStates"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "verifyMarketCreatorArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coreCollection",
            "type": "pubkey"
          },
          {
            "name": "merkleTree",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "winningDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "yes"
          },
          {
            "name": "no"
          },
          {
            "name": "draw"
          }
        ]
      }
    }
  ]
};
