"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const exec = __importStar(require("@actions/exec"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = new github.GitHub(core.getInput("repo-token", { required: true }));
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
            const issue = context.issue;
            console.log(`Collecting information about PR #${issue.number}...`);
            const { status, data: pr } = yield client.pulls.get({
                owner: issue.owner,
                repo: issue.repo,
                pull_number: issue.number
            });
            const baseRepo = pr.base.repo.full_name;
            const headRepo = pr.head.repo.full_name;
            const headBranch = pr.head.ref;
            const headCloneURL = pr.head.repo.clone_url;
            yield exec.exec("git", ["remote", "add", "pr", headCloneURL]);
            yield exec.exec("git", [
                "config",
                "--global",
                "user.email",
                "action@github.com"
            ]);
            yield exec.exec("git", [
                "config",
                "--global",
                "user.email",
                "GitHub Action"
            ]);
            yield exec.exec("git", ["fetch", "pr", headBranch]);
            yield exec.exec("git", ["checkout", "-b", headBranch, `pr/${headBranch}`]);
            yield exec.exec("Rscript", ["-e", 'install.packages("roxygen2")', "-e", 'roxygen2::roxygenise(".")']);
            yield exec.exec("git", ["add", "man/*", "NAMESPACE"]);
            yield exec.exec("git", ["commit", "-m", "Document"]);
            yield exec.exec("git", ["push", "pr", `HEAD:${headBranch}`]);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
