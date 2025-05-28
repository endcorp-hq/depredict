/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/shortx_contract.json`.
 */
export type ShortxContract = {
    "address": "3AhNo8g3CQ5EdLjYurtAodG7Zrbkv3aj94L1yiw8m9s6";
    "metadata": {
        "name": "shortxContract";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
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
                            "name": "createMarketArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "createOrder";
            "discriminator": [
                141,
                54,
                37,
                207,
                237,
                210,
                250,
                215
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
                    "name": "userTrade";
                    "writable": true;
                },
                {
                    "name": "market";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                },
                {
                    "name": "userAta";
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
                                "path": "mint";
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
                    "name": "marketVault";
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
                                "path": "mint";
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
                            "name": "openOrderArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "createSubUserTrade";
            "discriminator": [
                77,
                201,
                111,
                73,
                47,
                229,
                244,
                161
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "userTrade";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    117,
                                    115,
                                    101,
                                    114,
                                    95,
                                    116,
                                    114,
                                    97,
                                    100,
                                    101
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
                    "name": "subUserTrade";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    117,
                                    115,
                                    101,
                                    114,
                                    95,
                                    116,
                                    114,
                                    97,
                                    100,
                                    101
                                ];
                            },
                            {
                                "kind": "arg";
                                "path": "subUserKey";
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
                    "name": "subUserKey";
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
            "name": "createUserTrade";
            "discriminator": [
                232,
                235,
                58,
                194,
                135,
                248,
                153,
                1
            ];
            "accounts": [
                {
                    "name": "signer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "userTrade";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    117,
                                    115,
                                    101,
                                    114,
                                    95,
                                    116,
                                    114,
                                    97,
                                    100,
                                    101
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
            "args": [];
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
            "name": "settleOrder";
            "discriminator": [
                80,
                74,
                204,
                34,
                12,
                183,
                66,
                66
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
                    "name": "userTrade";
                    "writable": true;
                },
                {
                    "name": "market";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                },
                {
                    "name": "userAta";
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
                                "path": "mint";
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
                    "name": "marketVault";
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
                                "path": "mint";
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
                    "name": "orderId";
                    "type": "u64";
                }
            ];
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
        },
        {
            "name": "userTrade";
            "discriminator": [
                149,
                190,
                47,
                218,
                136,
                9,
                222,
                222
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
            "name": "orderEvent";
            "discriminator": [
                209,
                51,
                146,
                206,
                88,
                127,
                112,
                69
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
            "name": "insufficientFunds";
            "msg": "Insufficient funds";
        },
        {
            "code": 6002;
            "name": "invalidPrice";
            "msg": "Invalid price";
        },
        {
            "code": 6003;
            "name": "noAvailableOrderSlot";
            "msg": "No available order slot";
        },
        {
            "code": 6004;
            "name": "marketInactive";
            "msg": "Market is inactive";
        },
        {
            "code": 6005;
            "name": "orderNotFound";
            "msg": "Order not found";
        },
        {
            "code": 6006;
            "name": "questionPeriodNotStarted";
            "msg": "Question period not started";
        },
        {
            "code": 6007;
            "name": "questionPeriodEnded";
            "msg": "Question period ended";
        },
        {
            "code": 6008;
            "name": "marketStillActive";
            "msg": "Market still active";
        },
        {
            "code": 6009;
            "name": "insufficientLiquidity";
            "msg": "Insufficient liquidity";
        },
        {
            "code": 6010;
            "name": "marketAlreadyResolved";
            "msg": "Market already resolved";
        },
        {
            "code": 6011;
            "name": "concurrentTransaction";
            "msg": "Concurrent transaction";
        },
        {
            "code": 6012;
            "name": "marketNotAllowedToPayout";
            "msg": "Market Not allowed to payout";
        },
        {
            "code": 6013;
            "name": "userTradeIsSubUser";
            "msg": "User trade is sub user";
        },
        {
            "code": 6014;
            "name": "prizeNotFound";
            "msg": "Prize not found";
        },
        {
            "code": 6015;
            "name": "noPrizesAvailable";
            "msg": "No Prize Available";
        },
        {
            "code": 6016;
            "name": "alreadyLinked";
            "msg": "Already linked";
        },
        {
            "code": 6017;
            "name": "notLinked";
            "msg": "Not linked";
        },
        {
            "code": 6018;
            "name": "invalidCustomer";
            "msg": "Invalid customer";
        },
        {
            "code": 6019;
            "name": "invalidMint";
            "msg": "Invalid mint";
        },
        {
            "code": 6020;
            "name": "invalidFeeVault";
            "msg": "Invalid fee vault";
        },
        {
            "code": 6021;
            "name": "invalidShares";
            "msg": "Invalid shares";
        },
        {
            "code": 6022;
            "name": "unauthorizedToOrderBook";
            "msg": "Unauthorized to order book";
        },
        {
            "code": 6023;
            "name": "orderIsFullFilled";
            "msg": "Order is full filled";
        },
        {
            "code": 6024;
            "name": "overflow";
            "msg": "overflow";
        },
        {
            "code": 6025;
            "name": "marketAlreadyAggregated";
            "msg": "Market already aggregated";
        },
        {
            "code": 6026;
            "name": "invalidMarketId";
            "msg": "Invalid market id";
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
                        "name": "marketId";
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
                        "name": "marketStart";
                        "type": "i64";
                    },
                    {
                        "name": "marketEnd";
                        "type": "i64";
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
                        "name": "nextOrderId";
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
                        "name": "padding1";
                        "type": {
                            "array": [
                                "u8",
                                8
                            ];
                        };
                    },
                    {
                        "name": "nextOrderId";
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
            "name": "openOrderArgs";
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
                                "name": "orderDirection";
                            };
                        };
                    }
                ];
            };
        },
        {
            "name": "order";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "ts";
                        "type": "i64";
                    },
                    {
                        "name": "orderId";
                        "type": "u64";
                    },
                    {
                        "name": "marketId";
                        "type": "u64";
                    },
                    {
                        "name": "orderStatus";
                        "type": {
                            "defined": {
                                "name": "orderStatus";
                            };
                        };
                    },
                    {
                        "name": "price";
                        "type": "u64";
                    },
                    {
                        "name": "version";
                        "type": "u64";
                    },
                    {
                        "name": "orderDirection";
                        "type": {
                            "defined": {
                                "name": "orderDirection";
                            };
                        };
                    },
                    {
                        "name": "userNonce";
                        "type": "u32";
                    },
                    {
                        "name": "createdAt";
                        "type": "i64";
                    },
                    {
                        "name": "padding";
                        "type": {
                            "array": [
                                "u8",
                                3
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "orderDirection";
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
            "name": "orderEvent";
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
                        "name": "orderId";
                        "type": "u64";
                    },
                    {
                        "name": "price";
                        "type": "u64";
                    },
                    {
                        "name": "orderDirection";
                        "type": {
                            "defined": {
                                "name": "orderDirection";
                            };
                        };
                    },
                    {
                        "name": "orderStatus";
                        "type": {
                            "defined": {
                                "name": "orderStatus";
                            };
                        };
                    },
                    {
                        "name": "userNonce";
                        "type": "u32";
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
            "name": "orderStatus";
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
                        "type": {
                            "option": "i64";
                        };
                    },
                    {
                        "name": "winningDirection";
                        "type": {
                            "option": {
                                "defined": {
                                    "name": "winningDirection";
                                };
                            };
                        };
                    },
                    {
                        "name": "state";
                        "type": {
                            "option": {
                                "defined": {
                                    "name": "marketStates";
                                };
                            };
                        };
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
            "name": "userTrade";
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
                        "name": "totalDeposits";
                        "type": "u64";
                    },
                    {
                        "name": "totalWithdraws";
                        "type": "u64";
                    },
                    {
                        "name": "version";
                        "type": "u64";
                    },
                    {
                        "name": "orders";
                        "type": {
                            "array": [
                                {
                                    "defined": {
                                        "name": "order";
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
                        "name": "isSubUser";
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
