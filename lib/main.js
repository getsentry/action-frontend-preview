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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
const now_client_1 = require("now-client");
function run() {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!github.context.payload.pull_request) {
            core.setFailed('This action should only be run on pull requests');
            return;
        }
        const nowConfig = {
            token: core.getInput('zeitToken'),
            teamId: core.getInput('zeitTeamId'),
            path: process.env['GITHUB_WORKSPACE'],
        };
        const { owner, repo } = github.context.repo;
        const nowDeploy = {
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
        const pr = yield client.pulls.get(Object.assign(Object.assign({}, github.context.repo), { pull_number: github.context.payload.pull_request.number }));
        const ghDeploy = yield client.repos.createDeployment(Object.assign(Object.assign({}, github.context.repo), { environment: 'frontend-preview', transient_environment: true, ref: pr.data.head.ref, description: 'Zeit frontend build preview', required_contexts: [] }));
        try {
            for (var _b = __asyncValues(now_client_1.createDeployment(nowConfig, nowDeploy)), _c; _c = yield _b.next(), !_c.done;) {
                const event = _c.value;
                if (event.type !== 'hashes-calculated') {
                    console.log(event);
                }
                if (event.type == 'created') {
                    client.repos.createDeploymentStatus(Object.assign(Object.assign({}, github.context.repo), { deployment_id: ghDeploy.data.id, environment: 'qa', state: 'queued' }));
                }
                if (event.type === 'building') {
                    client.repos.createDeploymentStatus(Object.assign(Object.assign({}, github.context.repo), { deployment_id: ghDeploy.data.id, environment: 'qa', state: 'in_progress' }));
                }
                if (event.type === 'ready') {
                    client.repos.createDeploymentStatus(Object.assign(Object.assign({}, github.context.repo), { deployment_id: ghDeploy.data.id, environment: 'qa', state: 'success' }));
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
run();
