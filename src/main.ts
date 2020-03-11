import * as core from '@actions/core';
import * as github from '@actions/github';
import {createDeployment, NowClientOptions, DeploymentOptions} from 'now-client';

async function run(): Promise<void> {
  if (!github.context.payload.pull_request) {
    core.setFailed('This action should only be run on pull requests');
    return;
  }

  const nowConfig: NowClientOptions = {
    token: core.getInput('zeitToken'),
    path: process.env['GITHUB_WORKSPACE'] as string,
  };

  const {owner, repo} = github.context.repo;

  const nowDeploy: DeploymentOptions = {
    public: true,
    build: {
      env: {
        PULL_REQUEST: 'true',
        REVIEW_ID: github.context.payload.pull_request.number.toString(),
        repoUrl: `https://github.com/${owner}/${repo}`,
      },
    },
  };

  const githubToken = core.getInput('githubToken');

  const client = new github.GitHub({
    auth: githubToken,
    previews: ['flash-preview', 'ant-man-preview'],
  });

  const ghDeploy = await client.repos.createDeployment({
    ...github.context.repo,
    environment: 'qa',
    transient_environment: true,
    ref: github.context.ref,
    description: 'Zeit frontend build preview',
  });

  for await (const event of createDeployment(nowConfig, nowDeploy)) {
    console.log(event);

    if (event.type == 'created') {
      client.repos.createDeploymentStatus({
        ...github.context.repo,
        deployment_id: ghDeploy.data.id,
        environment: 'qa',
        state: 'queued',
      });
    }

    if (event.type === 'building') {
      client.repos.createDeploymentStatus({
        ...github.context.repo,
        deployment_id: ghDeploy.data.id,
        environment: 'qa',
        state: 'in_progress',
      });
    }

    if (event.type === 'ready') {
      client.repos.createDeploymentStatus({
        ...github.context.repo,
        deployment_id: ghDeploy.data.id,
        environment: 'qa',
        state: 'success',
      });
    }
  }
}

run();
