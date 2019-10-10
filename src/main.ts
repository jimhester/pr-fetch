import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";

async function run() {
  try {
    const token: string = core.getInput("repo-token", { required: true });

    const client: github.GitHub = new github.GitHub(token);

    const context = github.context;

    const lastComment = context.payload.comment;

    if (!(lastComment && lastComment.body.match("/document"))) {
      core.setFailed(`No comment matched`);
    }

    // Do nothing if its not a pr
    //if (!context.payload.pull_request) {
    //console.log(
    //"The event that triggered this action was not a pull request."
    //);
    //return;
    //}

    const issue: { owner: string; repo: string; number: number } =
      context.issue;

    console.log(`Collecting information about PR #${issue.number}...`);

    const { status, data: pr } = await client.pulls.get({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number
    });

    const baseRepo: string = pr.base.repo.full_name;
    const headRepo: string = pr.head.repo.full_name;
    const headBranch: string = pr.head.ref;
    const headCloneURL: string = pr.head.repo.clone_url;

    const headCloneURL2: string = headCloneURL.replace(
      "https://",
      `https://x-access-token:${token}@`
    );

    await exec.exec("git", ["remote", "add", "pr", headCloneURL2]);

    await exec.exec("git", [
      "config",
      "--global",
      "user.email",
      "action@github.com"
    ]);

    await exec.exec("git", [
      "config",
      "--global",
      "user.email",
      "GitHub Action"
    ]);

    await exec.exec("git", ["fetch", "pr", headBranch]);

    await exec.exec("git", ["checkout", "-b", headBranch, `pr/${headBranch}`]);

    await exec.exec("Rscript", [
      "-e",
      'install.packages("roxygen2")',
      "-e",
      'roxygen2::roxygenise(".")'
    ]);

    await exec.exec("git", ["add", "man/*", "NAMESPACE"]);

    await exec.exec("git", ["commit", "-m", "Document"]);

    await exec.exec("git", ["push", "pr", `HEAD:${headBranch}`]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
