/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/shortx_contract.json`.
 */
export type ShortxContract = {
    "address": "CR2SwZjpMJbCENVv2vnQbcHcT9Qx7mSjnFitgnqYxH4d";
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
                    "name": "oraclePubkey";
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
                                "kind": "account";
                                "path": "config.num_markets";
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
                                "path": "config.num_markets";
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
                    "name": "nftCollectionMint";
                    "writable": true;
                },
                {
                    "name": "nftCollectionMetadata";
                    "writable": true;
                },
                {
                    "name": "nftCollectionMasterEdition";
                    "writable": true;
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
                },
                {
                    "name": "tokenMetadataProgram";
                    "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
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
                    "name": "market";
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
            "name": "mintPosition";
            "discriminator": [
                251,
                31,
                179,
                3,
                138,
                134,
                203,
                28
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
                    "name": "nftMint";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "nftTokenAccount";
                    "writable": true;
                },
                {
                    "name": "metadataAccount";
                    "writable": true;
                },
                {
                    "name": "masterEdition";
                    "writable": true;
                },
                {
                    "name": "collectionMint";
                    "writable": true;
                },
                {
                    "name": "collectionMetadata";
                    "writable": true;
                },
                {
                    "name": "collectionAuthority";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "collectionMasterEdition";
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                },
                {
                    "name": "tokenMetadataProgram";
                    "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "sysvarInstructions";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "mintPositionArgs";
                        };
                    };
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
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "resolveMarketArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "settleNftPosition";
            "discriminator": [
                162,
                104,
                238,
                50,
                211,
                191,
                185,
                184
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
                    "name": "userNftTokenAccount";
                    "writable": true;
                },
                {
                    "name": "nftMetadataAccount";
                    "writable": true;
                },
                {
                    "name": "nftMasterEditionAccount";
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "token2022Program";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
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
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "payoutNftArgs";
                        };
                    };
                }
            ];
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
                    "name": "feeVault";
                    "writable": true;
                },
                {
                    "name": "marketPositionsAccount";
                    "writable": true;
                },
                {
                    "name": "market";
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
                    "name": "positionId";
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
            "name": "noAvailablePositionSlot";
            "msg": "No available position slot";
        },
        {
            "code": 6004;
            "name": "invalidOracle";
            "msg": "Invalid oracle";
        },
        {
            "code": 6005;
            "name": "oracleNotResolved";
            "msg": "Oracle not resolved";
        },
        {
            "code": 6006;
            "name": "marketInactive";
            "msg": "Market is inactive";
        },
        {
            "code": 6007;
            "name": "positionNotFound";
            "msg": "Position not found";
        },
        {
            "code": 6008;
            "name": "questionPeriodNotStarted";
            "msg": "Question period not started";
        },
        {
            "code": 6009;
            "name": "questionPeriodEnded";
            "msg": "Question period ended";
        },
        {
            "code": 6010;
            "name": "marketStillActive";
            "msg": "Market still active";
        },
        {
            "code": 6011;
            "name": "insufficientLiquidity";
            "msg": "Insufficient liquidity";
        },
        {
            "code": 6012;
            "name": "marketAlreadyResolved";
            "msg": "Market already resolved";
        },
        {
            "code": 6013;
            "name": "concurrentTransaction";
            "msg": "Concurrent transaction";
        },
        {
            "code": 6014;
            "name": "marketNotAllowedToPayout";
            "msg": "Market Not allowed to payout";
        },
        {
            "code": 6015;
            "name": "userTradeIsSubUser";
            "msg": "User trade is sub user";
        },
        {
            "code": 6016;
            "name": "prizeNotFound";
            "msg": "Prize not found";
        },
        {
            "code": 6017;
            "name": "noPrizesAvailable";
            "msg": "No Prize Available";
        },
        {
            "code": 6018;
            "name": "alreadyLinked";
            "msg": "Already linked";
        },
        {
            "code": 6019;
            "name": "notLinked";
            "msg": "Not linked";
        },
        {
            "code": 6020;
            "name": "invalidCustomer";
            "msg": "Invalid customer";
        },
        {
            "code": 6021;
            "name": "invalidMint";
            "msg": "Invalid mint";
        },
        {
            "code": 6022;
            "name": "invalidFeeVault";
            "msg": "Invalid fee vault";
        },
        {
            "code": 6023;
            "name": "invalidShares";
            "msg": "Invalid shares";
        },
        {
            "code": 6024;
            "name": "unauthorizedToOrderBook";
            "msg": "Unauthorized to order book";
        },
        {
            "code": 6025;
            "name": "orderIsFullFilled";
            "msg": "Order is full filled";
        },
        {
            "code": 6026;
            "name": "overflow";
            "msg": "overflow";
        },
        {
            "code": 6027;
            "name": "marketAlreadyAggregated";
            "msg": "Market already aggregated";
        },
        {
            "code": 6028;
            "name": "invalidMarketId";
            "msg": "Invalid market id";
        },
        {
            "code": 6029;
            "name": "invalidCollection";
            "msg": "Invalid collection";
        },
        {
            "code": 6030;
            "name": "invalidCollectionMint";
            "msg": "Invalid collection mint";
        },
        {
            "code": 6031;
            "name": "invalidAuthority";
            "msg": "Invalid collection authority";
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
                        "name": "nftCollectionMint";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "nftCollectionMetadata";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "nftCollectionMasterEdition";
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
            "name": "mintPositionArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "positionId";
                        "type": "u64";
                    },
                    {
                        "name": "metadataUri";
                        "type": "string";
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
                    }
                ];
            };
        },
        {
            "name": "payoutNftArgs";
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
                        "name": "isNft";
                        "type": "bool";
                    },
                    {
                        "name": "mint";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "authority";
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
                        "name": "marketId";
                        "type": "u64";
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
                        "name": "authority";
                        "type": {
                            "option": "pubkey";
                        };
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
                        "name": "isNft";
                        "type": "bool";
                    },
                    {
                        "name": "mint";
                        "type": {
                            "option": "pubkey";
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
            "name": "resolveMarketArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "marketId";
                        "type": "u64";
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
