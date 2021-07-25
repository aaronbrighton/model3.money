# Model3.Money

A static website that helps make the monthly cost of ownership clear to those trying to understand true cost of ownership between a Tesla Model 3 and other popular sedans.

## Screenshot

## Requirements

- [node](https://nodejs.org/en/download/)
- [yarn](https://classic.yarnpkg.com/en/docs/install/#debian-stable)
- [cdk](https://cdkworkshop.com/15-prerequisites.html)
- [projen](https://www.npmjs.com/package/projen)

## Setup & Installation

### Configuration (cdk.context.json)

Create a `cdk.context.json`, and populate the Route53 zone information for the custom domain to be used.

```
{
    "route53_HostedZoneId": "ZWO8BGKDHAA7T",
    "route53_ZoneName": "model3.money",
    "domains": [
        "model3.money",
        "www.model3.money"
    ]
}
```

### Install dependencies

```
yarn install
```

### Deploy

```
yarn deploy
```

### Check on the status of the deployment

Once CDK has finished standing up the CodePipeline pipeline in the `yarn deploy` step.  The pipeline will proceed with the actualy static site deployment.  You can check the status of it from the CodePipeline UI: [https://console.aws.amazon.com/codesuite/codepipeline/pipelines](https://console.aws.amazon.com/codesuite/codepipeline/pipelines)
