import * as anchor from '@coral-xyz/anchor';
import { Program, BN, web3 } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, Connection } from '@solana/web3.js';

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/shortx_contract.json`.
 */
type ShortxContract = {
    "address": "3eYQqCNDGWGJ7s76C7YFzrGHwT8cy94q2xyUr2ZNA3G2";
    "metadata": {
        "name": "shortxContract";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "closeConfig";
            "discriminator": [
                145,
                9,
                72,
                157,
                95,
                125,
                61,
                85
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        },
        {
            "name": "closeMarket";
            "discriminator": [
                88,
                154,
                248,
                186,
                48,
                14,
                123,
                244
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "feeVault";
                    "writable": true;
                },
                {
                    "name": "config";
                    "writable": true;
                },
                {
                    "name": "feeVaultUsdcAta";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "feeVault";
                            },
                            {
                                "kind": "const";
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
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "market";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    97,
                                    114,
                                    107,
                                    101,
                                    116
                                ];
                            },
                            {
                                "kind": "arg";
                                "path": "args.market_id";
                            }
                        ];
                    };
                },
                {
                    "name": "usdcMint";
                    "writable": true;
                },
                {
                    "name": "marketVault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "market";
                            },
                            {
                                "kind": "const";
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
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "marketPositionsAccount";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    111,
                                    115,
                                    105,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "arg";
                                "path": "args.market_id";
                            }
                        ];
                    };
                },
                {
                    "name": "tokenProgram";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "closeMarketArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "createMarket";
            "discriminator": [
                103,
                226,
                97,
                235,
                200,
                188,
                251,
                254
            ];
            "accounts": [
                {
                    "name": "payer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "feeVault";
                    "writable": true;
                },
                {
                    "name": "oraclePubkey";
                    "writable": true;
                },
                {
                    "name": "config";
                    "writable": true;
                },
                {
                    "name": "market";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    97,
                                    114,
                                    107,
                                    101,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "config.next_market_id";
                                "account": "config";
                            }
                        ];
                    };
                },
                {
                    "name": "marketPositionsAccount";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    111,
                                    115,
                                    105,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "config.next_market_id";
                                "account": "config";
                            }
                        ];
                    };
                },
                {
                    "name": "collection";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    108,
                                    108,
                                    101,
                                    99,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "config.next_market_id";
                                "account": "config";
                            }
                        ];
                    };
                },
                {
                    "name": "usdcMint";
                    "writable": true;
                },
                {
                    "name": "marketUsdcVault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "market";
                            },
                            {
                                "kind": "account";
                                "path": "tokenProgram";
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "mplCoreProgram";
                    "address": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "createMarketArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "createPosition";
            "discriminator": [
                48,
                215,
                197,
                153,
                96,
                203,
                180,
                133
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "feeVault";
                    "writable": true;
                },
                {
                    "name": "marketPositionsAccount";
                    "writable": true;
                },
                {
                    "name": "positionNftAccount";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    110,
                                    102,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "market_positions_account.market_id";
                                "account": "positionAccount";
                            },
                            {
                                "kind": "account";
                                "path": "market.next_position_id";
                                "account": "marketState";
                            }
                        ];
                    };
                },
                {
                    "name": "market";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    97,
                                    114,
                                    107,
                                    101,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "market_positions_account.market_id";
                                "account": "positionAccount";
                            }
                        ];
                    };
                },
                {
                    "name": "usdcMint";
                    "writable": true;
                },
                {
                    "name": "userUsdcAta";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "signer";
                            },
                            {
                                "kind": "account";
                                "path": "tokenProgram";
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "marketUsdcVault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "market";
                            },
                            {
                                "kind": "account";
                                "path": "tokenProgram";
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "config";
                },
                {
                    "name": "mplCoreProgram";
                    "address": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
                },
                {
                    "name": "collection";
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "openPositionArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "createSubPositionAccount";
            "discriminator": [
                194,
                196,
                200,
                66,
                242,
                197,
                107,
                188
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "market";
                    "writable": true;
                },
                {
                    "name": "marketPositionsAccount";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    111,
                                    115,
                                    105,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "market.market_id";
                                "account": "marketState";
                            }
                        ];
                    };
                },
                {
                    "name": "subMarketPositions";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    111,
                                    115,
                                    105,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "market_positions_account.market_id";
                                "account": "positionAccount";
                            },
                            {
                                "kind": "arg";
                                "path": "subPositionKey";
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "subPositionKey";
                    "type": "pubkey";
                }
            ];
        },
        {
            "name": "createUser";
            "discriminator": [
                108,
                227,
                130,
                130,
                252,
                109,
                75,
                218
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "user";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    117,
                                    115,
                                    101,
                                    114
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "signer";
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "createUserArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "initializeConfig";
            "discriminator": [
                208,
                127,
                21,
                1,
                194,
                190,
                196,
                70
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "feeVault";
                    "writable": true;
                },
                {
                    "name": "config";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "feeAmount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "resolveMarket";
            "discriminator": [
                155,
                23,
                80,
                173,
                46,
                74,
                23,
                239
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "market";
                    "writable": true;
                },
                {
                    "name": "oraclePubkey";
                    "writable": true;
                }
            ];
            "args": [];
        },
        {
            "name": "settlePosition";
            "discriminator": [
                33,
                156,
                74,
                218,
                215,
                42,
                112,
                175
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "market";
                    "writable": true;
                },
                {
                    "name": "marketPositionsAccount";
                    "writable": true;
                },
                {
                    "name": "usdcMint";
                    "writable": true;
                },
                {
                    "name": "userUsdcAta";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "signer";
                            },
                            {
                                "kind": "account";
                                "path": "tokenProgram";
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "marketUsdcVault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "market";
                            },
                            {
                                "kind": "account";
                                "path": "tokenProgram";
                            },
                            {
                                "kind": "account";
                                "path": "usdcMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
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
                            ];
                        };
                    };
                },
                {
                    "name": "nftMint";
                    "writable": true;
                },
                {
                    "name": "collection";
                    "writable": true;
                },
                {
                    "name": "mplCoreProgram";
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "tokenMetadataProgram";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        },
        {
            "name": "updateConfig";
            "discriminator": [
                29,
                158,
                252,
                191,
                10,
                83,
                219,
                99
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "feeVault";
                    "writable": true;
                },
                {
                    "name": "config";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "feeAmount";
                    "type": {
                        "option": "u64";
                    };
                },
                {
                    "name": "authority";
                    "type": {
                        "option": "pubkey";
                    };
                },
                {
                    "name": "feeVault";
                    "type": {
                        "option": "pubkey";
                    };
                }
            ];
        },
        {
            "name": "updateMarket";
            "discriminator": [
                153,
                39,
                2,
                197,
                179,
                50,
                199,
                217
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "market";
                    "writable": true;
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "updateMarketArgs";
                        };
                    };
                }
            ];
        }
    ];
    "accounts": [
        {
            "name": "config";
            "discriminator": [
                155,
                12,
                170,
                224,
                30,
                250,
                204,
                130
            ];
        },
        {
            "name": "marketState";
            "discriminator": [
                0,
                125,
                123,
                215,
                95,
                96,
                164,
                194
            ];
        },
        {
            "name": "positionAccount";
            "discriminator": [
                60,
                125,
                250,
                193,
                181,
                109,
                238,
                86
            ];
        },
        {
            "name": "user";
            "discriminator": [
                159,
                117,
                95,
                227,
                239,
                151,
                58,
                236
            ];
        }
    ];
    "events": [
        {
            "name": "marketEvent";
            "discriminator": [
                212,
                67,
                145,
                23,
                58,
                104,
                52,
                83
            ];
        },
        {
            "name": "poolEvent";
            "discriminator": [
                76,
                227,
                205,
                183,
                1,
                218,
                164,
                244
            ];
        },
        {
            "name": "positionEvent";
            "discriminator": [
                169,
                63,
                86,
                103,
                243,
                59,
                238,
                111
            ];
        },
        {
            "name": "priceEvent";
            "discriminator": [
                31,
                40,
                141,
                125,
                132,
                253,
                225,
                229
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "unauthorized";
            "msg": "Unauthorized Instruction";
        },
        {
            "code": 6001;
            "name": "configInUse";
            "msg": "Config account in use, cannot close it";
        },
        {
            "code": 6002;
            "name": "arithmeticOverflow";
            "msg": "Arithmetic overflow";
        },
        {
            "code": 6003;
            "name": "insufficientFunds";
            "msg": "Insufficient funds";
        },
        {
            "code": 6004;
            "name": "invalidPrice";
            "msg": "Invalid price";
        },
        {
            "code": 6005;
            "name": "noAvailablePositionSlot";
            "msg": "No available position slot";
        },
        {
            "code": 6006;
            "name": "invalidOracle";
            "msg": "Invalid oracle";
        },
        {
            "code": 6007;
            "name": "oracleNotResolved";
            "msg": "Oracle not resolved";
        },
        {
            "code": 6008;
            "name": "marketInactive";
            "msg": "Market is inactive";
        },
        {
            "code": 6009;
            "name": "positionNotFound";
            "msg": "Position not found";
        },
        {
            "code": 6010;
            "name": "questionPeriodNotStarted";
            "msg": "Question period not started";
        },
        {
            "code": 6011;
            "name": "questionPeriodEnded";
            "msg": "Question period ended";
        },
        {
            "code": 6012;
            "name": "marketStillActive";
            "msg": "Market still active";
        },
        {
            "code": 6013;
            "name": "insufficientLiquidity";
            "msg": "Insufficient liquidity";
        },
        {
            "code": 6014;
            "name": "marketAlreadyResolved";
            "msg": "Market already resolved";
        },
        {
            "code": 6015;
            "name": "concurrentTransaction";
            "msg": "Concurrent transaction";
        },
        {
            "code": 6016;
            "name": "marketNotAllowedToPayout";
            "msg": "Market Not allowed to payout";
        },
        {
            "code": 6017;
            "name": "userTradeIsSubUser";
            "msg": "User trade is sub user";
        },
        {
            "code": 6018;
            "name": "prizeNotFound";
            "msg": "Prize not found";
        },
        {
            "code": 6019;
            "name": "noPrizesAvailable";
            "msg": "No Prize Available";
        },
        {
            "code": 6020;
            "name": "alreadyLinked";
            "msg": "Already linked";
        },
        {
            "code": 6021;
            "name": "notLinked";
            "msg": "Not linked";
        },
        {
            "code": 6022;
            "name": "invalidCustomer";
            "msg": "Invalid customer";
        },
        {
            "code": 6023;
            "name": "invalidMint";
            "msg": "Invalid mint";
        },
        {
            "code": 6024;
            "name": "invalidFeeVault";
            "msg": "Invalid fee vault";
        },
        {
            "code": 6025;
            "name": "invalidShares";
            "msg": "Invalid shares";
        },
        {
            "code": 6026;
            "name": "unauthorizedToOrderBook";
            "msg": "Unauthorized to order book";
        },
        {
            "code": 6027;
            "name": "orderIsFullFilled";
            "msg": "Order is full filled";
        },
        {
            "code": 6028;
            "name": "overflow";
            "msg": "overflow";
        },
        {
            "code": 6029;
            "name": "marketAlreadyAggregated";
            "msg": "Market already aggregated";
        },
        {
            "code": 6030;
            "name": "invalidMarketId";
            "msg": "Invalid market id";
        },
        {
            "code": 6031;
            "name": "invalidCollection";
            "msg": "Invalid collection";
        },
        {
            "code": 6032;
            "name": "invalidCollectionMint";
            "msg": "Invalid collection mint";
        },
        {
            "code": 6033;
            "name": "invalidAuthority";
            "msg": "Invalid collection authority";
        },
        {
            "code": 6034;
            "name": "invalidMplCoreProgram";
            "msg": "Invalid mpl core program";
        }
    ];
    "types": [
        {
            "name": "closeMarketArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "marketId";
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "config";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "bump";
                        "type": "u8";
                    },
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "feeVault";
                        "type": "pubkey";
                    },
                    {
                        "name": "feeAmount";
                        "type": "u64";
                    },
                    {
                        "name": "version";
                        "type": "u64";
                    },
                    {
                        "name": "nextMarketId";
                        "type": "u64";
                    },
                    {
                        "name": "numMarkets";
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "createMarketArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "question";
                        "type": {
                            "array": [
                                "u8",
                                80
                            ];
                        };
                    },
                    {
                        "name": "marketStart";
                        "type": "i64";
                    },
                    {
                        "name": "marketEnd";
                        "type": "i64";
                    },
                    {
                        "name": "metadataUri";
                        "type": "string";
                    }
                ];
            };
        },
        {
            "name": "createUserArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "id";
                        "type": "u16";
                    }
                ];
            };
        },
        {
            "name": "marketEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "yesLiquidity";
                        "type": "u64";
                    },
                    {
                        "name": "noLiquidity";
                        "type": "u64";
                    },
                    {
                        "name": "volume";
                        "type": "u64";
                    },
                    {
                        "name": "updateTs";
                        "type": "i64";
                    },
                    {
                        "name": "nextPositionId";
                        "type": "u64";
                    },
                    {
                        "name": "marketState";
                        "type": {
                            "defined": {
                                "name": "marketStates";
                            };
                        };
                    },
                    {
                        "name": "marketStart";
                        "type": "i64";
                    },
                    {
                        "name": "marketEnd";
                        "type": "i64";
                    },
                    {
                        "name": "question";
                        "type": {
                            "array": [
                                "u8",
                                80
                            ];
                        };
                    },
                    {
                        "name": "winningDirection";
                        "type": {
                            "defined": {
                                "name": "winningDirection";
                            };
                        };
                    }
                ];
            };
        },
        {
            "name": "marketState";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "bump";
                        "type": "u8";
                    },
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "oraclePubkey";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "nftCollection";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "marketUsdcVault";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "yesLiquidity";
                        "type": "u64";
                    },
                    {
                        "name": "noLiquidity";
                        "type": "u64";
                    },
                    {
                        "name": "volume";
                        "type": "u64";
                    },
                    {
                        "name": "updateTs";
                        "type": "i64";
                    },
                    {
                        "name": "padding1";
                        "type": {
                            "array": [
                                "u8",
                                8
                            ];
                        };
                    },
                    {
                        "name": "nextPositionId";
                        "type": "u64";
                    },
                    {
                        "name": "marketState";
                        "type": {
                            "defined": {
                                "name": "marketStates";
                            };
                        };
                    },
                    {
                        "name": "marketStart";
                        "type": "i64";
                    },
                    {
                        "name": "marketEnd";
                        "type": "i64";
                    },
                    {
                        "name": "question";
                        "type": {
                            "array": [
                                "u8",
                                80
                            ];
                        };
                    },
                    {
                        "name": "winningDirection";
                        "type": {
                            "defined": {
                                "name": "winningDirection";
                            };
                        };
                    },
                    {
                        "name": "version";
                        "type": "u64";
                    },
                    {
                        "name": "padding";
                        "type": {
                            "array": [
                                "u8",
                                72
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "marketStates";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "active";
                    },
                    {
                        "name": "ended";
                    },
                    {
                        "name": "resolving";
                    },
                    {
                        "name": "resolved";
                    }
                ];
            };
        },
        {
            "name": "openPositionArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "direction";
                        "type": {
                            "defined": {
                                "name": "positionDirection";
                            };
                        };
                    },
                    {
                        "name": "metadataUri";
                        "type": "string";
                    }
                ];
            };
        },
        {
            "name": "poolEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "poolId";
                        "type": "u64";
                    },
                    {
                        "name": "question";
                        "type": {
                            "array": [
                                "u8",
                                80
                            ];
                        };
                    },
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "markets";
                        "type": {
                            "array": [
                                "u64",
                                60
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "position";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "positionId";
                        "type": "u64";
                    },
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "direction";
                        "type": {
                            "defined": {
                                "name": "positionDirection";
                            };
                        };
                    },
                    {
                        "name": "createdAt";
                        "type": "i64";
                    },
                    {
                        "name": "ts";
                        "type": "i64";
                    },
                    {
                        "name": "mint";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "positionStatus";
                        "type": {
                            "defined": {
                                "name": "positionStatus";
                            };
                        };
                    },
                    {
                        "name": "positionNonce";
                        "type": "u32";
                    },
                    {
                        "name": "padding";
                        "type": {
                            "array": [
                                "u8",
                                3
                            ];
                        };
                    },
                    {
                        "name": "version";
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "positionAccount";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "bump";
                        "type": "u8";
                    },
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "version";
                        "type": "u64";
                    },
                    {
                        "name": "positions";
                        "type": {
                            "array": [
                                {
                                    "defined": {
                                        "name": "position";
                                    };
                                },
                                10
                            ];
                        };
                    },
                    {
                        "name": "nonce";
                        "type": "u32";
                    },
                    {
                        "name": "isSubPosition";
                        "type": "bool";
                    },
                    {
                        "name": "padding";
                        "type": {
                            "array": [
                                "u8",
                                25
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "positionDirection";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "yes";
                    },
                    {
                        "name": "no";
                    }
                ];
            };
        },
        {
            "name": "positionEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "positionId";
                        "type": "u64";
                    },
                    {
                        "name": "mint";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "positionNonce";
                        "type": "u32";
                    },
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "direction";
                        "type": {
                            "defined": {
                                "name": "positionDirection";
                            };
                        };
                    },
                    {
                        "name": "positionStatus";
                        "type": {
                            "defined": {
                                "name": "positionStatus";
                            };
                        };
                    },
                    {
                        "name": "ts";
                        "type": "i64";
                    },
                    {
                        "name": "createdAt";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "positionStatus";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "init";
                    },
                    {
                        "name": "open";
                    },
                    {
                        "name": "closed";
                    },
                    {
                        "name": "claimed";
                    }
                ];
            };
        },
        {
            "name": "priceEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "yesPrice";
                        "type": "u64";
                    },
                    {
                        "name": "noPrice";
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "updateMarketArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "marketEnd";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "user";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "bump";
                        "type": "u8";
                    },
                    {
                        "name": "id";
                        "type": "u16";
                    },
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "padding";
                        "type": {
                            "array": [
                                "u8",
                                32
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "winningDirection";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "none";
                    },
                    {
                        "name": "yes";
                    },
                    {
                        "name": "no";
                    },
                    {
                        "name": "draw";
                    }
                ];
            };
        }
    ];
};

type Market = {
    address: string;
    bump: number;
    authority: string;
    oraclePubkey: string;
    nftCollectionMint: string;
    marketUsdcVault: string;
    marketId: string;
    yesLiquidity: string;
    noLiquidity: string;
    volume: string;
    updateTs: string;
    nextPositionId: string;
    marketState: MarketStates;
    marketStart: string;
    marketEnd: string;
    question: string;
    winningDirection: WinningDirection;
};
declare enum MarketStates {
    ACTIVE = "active",
    ENDED = "ended",
    RESOLVING = "resolving",
    RESOLVED = "resolved"
}
declare enum WinningDirection {
    NONE = "None",
    YES = "Yes",
    NO = "No",
    DRAW = "Draw"
}
type InitializeMarketArgs = {
    marketId: number;
    startTime: number;
    endTime: number;
    question: string;
    feeBps: number;
    customer: PublicKey | null;
};
type CreateCustomerArgs = {
    id: number;
    name: string;
    authority: PublicKey;
    feeRecipient: PublicKey;
};
type OpenOrderArgs = {
    marketId: number;
    amount: number;
    token: string;
    direction: {
        yes: {};
    } | {
        no: {};
    };
    mint: PublicKey;
    payer: PublicKey;
    feeVaultAccount: PublicKey;
    usdcMintAddress: PublicKey;
    metadataUri: string;
};
type CreateMarketArgs = {
    startTime: number;
    endTime: number;
    question: string;
    oraclePubkey: PublicKey;
    metadataUri: string;
    payer: PublicKey;
    feeVaultAccount: PublicKey;
    usdcMintAddress: PublicKey;
};

type RpcOptions = {
    skipPreflight?: boolean;
    microLamports?: number;
    computeBudget?: number;
};

type PositionAccount = {
    authority: PublicKey;
    positions: Position$1[];
    nonce: number;
    isSubPosition: boolean;
    marketId: number;
};
type Position$1 = {
    ts: string;
    positionId: string;
    marketId: string;
    positionStatus: PositionStatus;
    amount: string;
    mint: string;
    direction: PositionDirection;
    positionNonce: string;
    createdAt: string;
};
declare enum PositionDirection {
    YES = "yes",
    NO = "no"
}
declare enum PositionStatus {
    INIT = "init",
    OPEN = "open",
    CLOSED = "closed",
    CLAIMED = "claimed",
    LIQUIDATED = "liquidated",
    WAITING = "waiting"
}

declare class Position {
    private program;
    METAPLEX_PROGRAM_ID: PublicKey;
    constructor(program: Program<ShortxContract>);
    /**
     * Get all Position Accounts for a Market
     * @param marketId - Market ID
     *
     */
    getPositionsAccountsForMarket(marketId: number): Promise<PositionAccount[]>;
    /**
     * Get all Positions for a user
     * @param user - User PublicKey
     *
     */
    /**
     * Get User positions for a particular market
     * @param user - User PublicKey
     * @param marketId - Market ID
     */
    /**
     * Get the PDA for a position account
     * @param marketId - Market ID
     * @param marketAddress - Market Address
     * @param positionNonce - The nonce of the position account
     *
     */
    getPositionsAccountPda(marketId: number, positionNonce?: number): Promise<{
        bump: number;
        marketId: BN;
        authority: PublicKey;
        version: BN;
        positions: {
            positionId: BN;
            marketId: BN;
            amount: BN;
            direction: ({
                no?: undefined;
            } & {
                yes: Record<string, never>;
            }) | ({
                yes?: undefined;
            } & {
                no: Record<string, never>;
            });
            createdAt: BN;
            ts: BN;
            mint: PublicKey | null;
            positionStatus: ({
                open?: undefined;
                closed?: undefined;
                claimed?: undefined;
            } & {
                init: Record<string, never>;
            }) | ({
                init?: undefined;
                closed?: undefined;
                claimed?: undefined;
            } & {
                open: Record<string, never>;
            }) | ({
                init?: undefined;
                open?: undefined;
                claimed?: undefined;
            } & {
                closed: Record<string, never>;
            }) | ({
                init?: undefined;
                open?: undefined;
                closed?: undefined;
            } & {
                claimed: Record<string, never>;
            });
            positionNonce: number;
            padding: number[];
            version: BN;
        }[];
        nonce: number;
        isSubPosition: boolean;
        padding: number[];
    }>;
    /**
     * Create Sub positions account
     * @param user - User PublicKey the main user
     * @param payer - Payer PublicKey
     * @param options - RPC options
     *
     */
    createSubPositionAccount(marketId: number, payer: PublicKey, marketAddress: PublicKey, options?: RpcOptions): Promise<TransactionInstruction[]>;
    /**
     * Get position account Nonce With Slots
     * @param positionAccounts - Position Accounts
     *
     */
    getPositionAccountNonceWithSlots(positionAccounts: PositionAccount[], payer: PublicKey): PublicKey;
    getPositionAccountIxs(marketId: number, payer: PublicKey): Promise<{
        positionAccountPDA: PublicKey;
        ixs: TransactionInstruction[];
    }>;
}

declare class Trade {
    private program;
    METAPLEX_PROGRAM_ID: anchor.web3.PublicKey;
    decimals: number;
    position: Position;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    USDC_MINT: PublicKey;
    constructor(program: Program<ShortxContract>, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey);
    /**
     * Get All Markets
     *
     */
    getAllMarkets(): Promise<Market[]>;
    /**
     * Get Market By ID
     * @param marketId - The ID of the market
     *
     */
    getMarketById(marketId: number): Promise<Market>;
    /**
     * Get Market By Address
     * @param address - The address of the market PDA
     *
     */
    getMarketByAddress(address: PublicKey): Promise<Market>;
    /**
     * Create Market
     * @param args.marketId - new markert id - length + 1
     * @param args.startTime - start time
     * @param args.endTime - end time
     * @param args.question - question (max 80 characters)
     * @param args.oraclePubkey - oracle pubkey
     * @param args.metadataUri - metadata uri
     * @param args.mintPublicKey - collection mint public key. This needs to sign the transaction.
     * @param args.payer - payer
     * @param options - RPC options
     *
     */
    createMarket({ startTime, endTime, question, oraclePubkey, metadataUri, payer, }: CreateMarketArgs, options?: RpcOptions): Promise<{
        txs: anchor.web3.VersionedTransaction[];
        marketId: number;
    }>;
    /**
     * Open Order
     * @param args.marketId - The ID of the Market
     * @param args.amount - The amount of the Order
     * @param args.direction - The direction of the Order
     * @param args.mint - The mint of the Order
     * @param args.token - The token to use for the Order
     * @param args.payer - The payer of the Order
     * @param options - RPC options
     *
     */
    openPosition({ marketId, amount, direction, mint, token, payer, metadataUri }: OpenOrderArgs, options?: RpcOptions): Promise<{
        ixs: anchor.web3.TransactionInstruction[];
        addressLookupTableAccounts: anchor.web3.AddressLookupTableAccount[];
    } | undefined>;
    /**
     * Resolve Market
     * @param args.marketId - The ID of the Market
     * @param args.winningDirection - The Winning Direction of the Market
     *
     * @param options - RPC options
     *
     */
    resolveMarket({ marketId, payer, }: {
        marketId: number;
        payer: PublicKey;
    }, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    /**
     * Close Market and related accounts to collect remaining liquidity
     * @param marketId - The ID of the market
     * @param payer - The payer of the Market
     * @param options - RPC options
     *
     */
    closeMarket(marketId: number, payer: PublicKey, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    /**
     * Update Market
     * @param marketId - The ID of the market
     * @param marketEnd - The end time of the market
     * @param options - RPC options
     *
     */
    updateMarket(marketId: number, marketEnd: number, payer: PublicKey, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    payoutPosition(marketId: number, payer: PublicKey, positionId: number, positionNonce: number, options?: RpcOptions): Promise<anchor.web3.VersionedTransaction>;
}

declare class Config {
    private program;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    USDC_MINT: PublicKey;
    trade: Trade;
    constructor(program: Program<ShortxContract>, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey);
    /**
     * Init a config account to maintain details
     *
     */
    createConfig(feeAmount: number, payer: PublicKey): Promise<web3.TransactionInstruction[]>;
    /**
     * Get a config account to maintain details if it exists
     *
     */
    getConfig(): Promise<{
        bump: number;
        authority: web3.PublicKey;
        feeVault: web3.PublicKey;
        feeAmount: BN;
        version: BN;
        nextMarketId: BN;
        numMarkets: BN;
    } | null>;
    /**
     * Update a config account to maintain details
     *
     */
    updateConfig(payer: PublicKey, feeAmount?: number, authority?: PublicKey, feeVault?: PublicKey): Promise<web3.TransactionInstruction[]>;
    /**
     * Close a config account
     * @param payer - PublicKey of the payer
     * @returns TransactionInstruction[] - Array of TransactionInstruction
     */
    closeConfig(payer: PublicKey): Promise<web3.TransactionInstruction[]>;
}

declare class ShortXClient {
    program: Program<ShortxContract>;
    trade: Trade;
    config: Config;
    position: Position;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    USDC_MINT: PublicKey;
    constructor(connection: Connection, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey);
}

export { type CreateCustomerArgs, type CreateMarketArgs, type InitializeMarketArgs, type Market, MarketStates, type OpenOrderArgs, type Position$1 as Position, type PositionAccount, PositionDirection, PositionStatus, type RpcOptions, type ShortxContract, WinningDirection, ShortXClient as default };
