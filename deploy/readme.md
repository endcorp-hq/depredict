# Deployment with verified build and security. 

Setup scripts for deploying program as a verified build. 


#### Build verified locally
Create image from dockerfile, run the following from the root of the project. 
`docker build -t depredict-build:latest ./deploy`

Then run the local build process to spin up a docker container. This will take a little while. 
`solana-verify build -b depredict-build:latest`

#### Deploy on chain
For devnet:
`solana program deploy -u devnet target/deploy/depredict.so --program-id target/deploy/depredict-keypair.json --with-compute-unit-price 50000 --max-sign-attempts 100`

For mainnet: 
`solana program deploy -u mainnet-beta target/deploy/depredict.so --program-id target/deploy/depredict-keypair.json --with-compute-unit-price 50000 --max-sign-attempts 100 --upgrade-authority ./path/to/auth.json --fee-payer ./path/to/auth.json`

#### Check onchain program hash
`solana-verify get-program-hash -u devnet DPxxBPxcgMwYuDDC8dbYZdqnGehErmwKQYC4ifVz5tpM`


#### Verify locally from repo (Takes a while)
Replace commit hash with your new commit. 
`solana-verify verify-from-repo -u devnet --program-id DPxxBPxcgMwYuDDC8dbYZdqnGehErmwKQYC4ifVz5tpM https://github.com/endcorp-hq/depredict.git --commit-hash 68d8be45ab7b33b5edf54cf480031441d456c130 --library-name depredict --mount-path --base-image depredict-build:latest`

