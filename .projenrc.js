const { AwsCdkTypeScriptApp, ProjectType } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.107.0',
  cdkVersionPinning: true,
  defaultReleaseBranch: 'main',
  authorAddress: 'aaron@aaronbrighton.ca',
  authorName: 'Aaron Brighton',
  name: 'model3.money',
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-route53',
    '@aws-cdk/aws-route53-targets',
    '@aws-cdk/aws-certificatemanager',
    '@aws-solutions-constructs/aws-cloudfront-s3',
    '@aws-cdk/aws-s3-deployment',
    '@aws-cdk/aws-codepipeline',
    '@aws-cdk/aws-codepipeline-actions',
    '@aws-cdk/pipelines',
  ],
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': true,
  },
  projectType: ProjectType.APP,
  release: false,
});

project.npmignore.exclude('cdk.context.json');
project.gitignore.exclude('cdk.context.json');

project.synth();