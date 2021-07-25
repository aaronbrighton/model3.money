import * as path from 'path';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import { App, Construct, Stack, StackProps, Duration, Stage, StageProps, SecretValue } from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export interface Model3DotMoneyProps {
  route53_HostedZoneId: string;
  route53_ZoneName: string;
  domains: string[];
}

export class Model3DotMoneyStack extends Stack {
  constructor(scope: Construct, id: string, props: Model3DotMoneyProps) {
    super(scope, id);

    const domains = props.domains;

    const publicZone = route53.HostedZone.fromHostedZoneAttributes(this, 'route53-zone', {
      hostedZoneId: props.route53_HostedZoneId,
      zoneName: props.route53_ZoneName,
    });

    const customCertificate = new acm.Certificate(this, 'custom-certificate', {
      domainName: domains[0],
      subjectAlternativeNames: domains.slice(1),
      validation: acm.CertificateValidation.fromDns(publicZone),
    });

    const cloudfrontToS3Resource = new CloudFrontToS3(this, 'cloudfront-s3', {
      insertHttpSecurityHeaders: false,
      cloudFrontDistributionProps: {
        certificate: customCertificate,
        domainNames: domains,
      },
    });

    let counter: number = 0;
    domains.forEach((domain) => {
      counter += 1;

      new route53.ARecord(this, `route53-a-record${counter}`, {
        zone: publicZone,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontToS3Resource.cloudFrontWebDistribution)),
        recordName: domain,
      });

      new route53.AaaaRecord(this, `route53-aaaa-record${counter}`, {
        zone: publicZone,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontToS3Resource.cloudFrontWebDistribution)),
        recordName: domain,
      });
    });

    if (cloudfrontToS3Resource.s3Bucket) {
      new s3deploy.BucketDeployment(this, 'website-deploy', {
        sources: [s3deploy.Source.asset(path.join(__dirname, 'html'))],
        destinationBucket: cloudfrontToS3Resource.s3Bucket,
        cacheControl: [
          s3deploy.CacheControl.setPublic(),
          s3deploy.CacheControl.mustRevalidate(),
          s3deploy.CacheControl.maxAge(Duration.hours(1)),
        ],
        distribution: cloudfrontToS3Resource.cloudFrontWebDistribution,
      });
    }
  }
}

class DeployStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);


    new Model3DotMoneyStack(this, 'model3-money', {
      route53_HostedZoneId: process.env.route53_HostedZoneId ?? this.node.tryGetContext('route53_HostedZoneId'),
      route53_ZoneName: process.env.route53_ZoneName ?? this.node.tryGetContext('route53_ZoneName'),
      domains: String(process.env.domains ?? this.node.tryGetContext('domains')).split(','),
    });
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      output: sourceArtifact,
      oauthToken: SecretValue.secretsManager('github-token'),
      owner: 'aaronbrighton',
      repo: 'model3.money',
      branch: 'main',
    });

    const synthAction = pipelines.SimpleSynthAction.standardYarnSynth({
      sourceArtifact,
      cloudAssemblyArtifact,
      environmentVariables: {
        route53_HostedZoneId: {
          value: process.env.route53_HostedZoneId ?? this.node.tryGetContext('route53_HostedZoneId'),
        },
        route53_ZoneName: {
          value: process.env.route53_ZoneName ?? this.node.tryGetContext('route53_ZoneName'),
        },
        domains: {
          value: String(process.env.domains ?? this.node.tryGetContext('domains')).split(','),
        },
      },
      buildCommand: 'yarn build && yarn test',
    });

    const pipeline = new pipelines.CdkPipeline(this, 'model3-money-pipeline', {
      cloudAssemblyArtifact,
      sourceAction,
      synthAction,
    });

    pipeline.addApplicationStage(new DeployStage(this, 'prod'));
  }
}


const app = new App();
new PipelineStack(app, 'model3-money-pipeline');


app.synth();