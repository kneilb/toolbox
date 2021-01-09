const { exec } = require("child_process");

let toDelete = [];

function deleteResource(cmd) {
    tryDelete(cmd);

    while (toDelete.length !== 0) {
        const path = toDelete.pop();
        tryDeletePath(path);
    }
}

function tryDelete(cmd, path='') {
    exec (cmd, (error, stderr, stdout) => {
        if (error) {
            console.log(`error: ${error.message}`);
            const userPath = findUserPath(error.message);
            if (userPath.length === 0) {
                return;
            }
            toDelete.push(path);
            tryDeletePath(userPath);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function findPathPart(path, partIndex) {
    let startIndex = 0;
    let endIndex = 0;
    for (let i = 0; i <= partIndex; ++i) {
        startIndex = endIndex;
        endIndex = path.indexOf('/', startIndex + 1);
    }
    return path.slice(startIndex, endIndex).replace(/[\/\n ]/g, '');
}

function getProjectFromPath(path) {
    const startIndex = path.indexOf('/') + 1;
    const endIndex = path.indexOf('/', startIndex)
    return path.slice(startIndex, endIndex).replace(/[\/\n ]/g, '');
}

function getTypeFromPath(path) {
    const endIndex = path.lastIndexOf('/');
    const startIndex = path.lastIndexOf('/', endIndex - 1) + 1;
    return path.slice(startIndex, endIndex).replace(/[\/\n ]/g, '');
}

function getNameFromPath(path) {
    return path.slice(path.lastIndexOf('/') + 1).replace(/[\/\n ]/g, '');
}

function findUserPath(err) {
    const searchFor = 'is already being used by';
    const found = err.indexOf(searchFor);
    if (found < 0) {
        return '';
    }
    let user = err.slice(found + searchFor.length);
    return user.replace(/[' ]/g, '');
}

function tryDeletePath(path) {
    console.log(`Attempting to delete object at: ${path}`)

    const cmd = generateCommand(path);
    if (!cmd) {
        return false;
    }
    console.log(cmd);
    tryDelete(cmd, path);
    return true;
}

function generateCommand(path) {
    const project = getProjectFromPath(path);
    const type = getTypeFromPath(path);
    const name = getNameFromPath(path);

    let cmd = 'gcloud compute ';

    let addLocationSpec = false;

    switch (type) {
        case 'firewalls':
            cmd += 'firewall-rules delete ';
            break;
        case 'routes':
            cmd += 'routes delete ';
            break;
        case 'networkEndpointGroups':
            cmd += 'network-endpoint-groups delete ';
            addLocationSpec = true;
            break;
        case 'backendServices':
            cmd += 'backend-services delete ';
            addLocationSpec = true;
            break;
        case 'urlMaps':
            cmd += 'url-maps delete ';
            break;
        case 'targetHttpProxies':
            cmd += 'target-http-proxies delete ';
            break;
        case 'targetHttpsProxies':
            cmd += 'target-https-proxies delete ';
            break;
        case 'forwardingRules':
            cmd += 'forwarding-rules delete ';
            addLocationSpec = true;
            break;
        default:
            console.log(`Don't know how to delete ${type} - please teach me!`)
            return '';
    }

    if (addLocationSpec) {
        if (path.includes('/zones/')) {
            cmd += '--zone ';
            cmd += findPathPart(path, 3) + ' ';
        } else if (path.includes('/regions/')) {
            cmd += '--region ';
            cmd += findPathPart(path, 3) + ' ';
        } else if (path.includes('/global/')) {
            cmd += '--global ';
        }
    }

    cmd += name;
    cmd += ' --quiet';

    return cmd;
}

deleteResource('gcloud compute networks delete rich-dev21-west3 --quiet');

// tryDelete('gcloud compute networks delete rich-dev22-west3 --quiet');
