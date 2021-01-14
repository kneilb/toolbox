const { exec } = require("child_process");

let pathsToDelete = [];

function tryDelete(cmd, path) {
    console.log(`Attempting to delete ${path} using: ${cmd}`)
    exec(cmd, (error, stderr, stdout) => {
        if (error) {
            pathsToDelete.push(path);
            console.log(`Failed to delete: ${path}`);
            const userPath = findUserPath(error.message);
            if (userPath.length === 0) {
                console.log(`Unexpected error: ${error.message}`);
                return;
            }
            tryDeletePath(userPath);
            return;
        }

        console.log(`Successfully deleted: ${path}`);
        while (pathsToDelete.length !== 0) {
            tryDeletePath(pathsToDelete.pop());
        }
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
    return err.slice(found + searchFor.length).replace(/[' \n\r]/g, '');
}

function tryDeletePath(path) {
    const cmd = generateCommand(path);
    if (!cmd) {
        return false;
    }
    tryDelete(cmd, path);
    return true;
}

function generateCommand(path) {
    if (!path) {
        return;
    }

    const type = getTypeFromPath(path);
    const name = getNameFromPath(path);

    let cmd = 'gcloud compute ';

    let addLocationSpec = false;
    let includeGlobal = true;

    switch (type) {
        case 'addresses':
            cmd += 'addresses delete ';
            addLocationSpec = true;
            break;
        case 'backendServices':
            cmd += 'backend-services delete ';
            addLocationSpec = true;
            break;
        case 'firewalls':
            cmd += 'firewall-rules delete ';
            break;
        case 'forwardingRules':
            cmd += 'forwarding-rules delete ';
            addLocationSpec = true;
            break;
        case 'instances':
            cmd += 'instances delete --delete-disks all '
            addLocationSpec = true;
            break;
        case 'networkEndpointGroups':
            cmd += 'network-endpoint-groups delete ';
            addLocationSpec = true;
            break;
        case 'networks':
            cmd += 'networks delete ';
            addLocationSpec = true;
            includeGlobal = false;
            break;
        case 'routers':
            cmd += 'routers delete ';
            addLocationSpec = true;
            break;
        case 'routes':
            cmd += 'routes delete ';
            break;
        case 'subnetworks':
            cmd += 'networks subnets delete ';
            addLocationSpec = true;
            break;
        case 'targetHttpProxies':
            cmd += 'target-http-proxies delete ';
            break;
        case 'targetHttpsProxies':
            cmd += 'target-https-proxies delete ';
            break;
        case 'urlMaps':
            cmd += 'url-maps delete ';
            break;
        default:
            console.warn(`Don't know how to delete ${path} (${type}) - please teach me!`)
            return;
    }

    if (addLocationSpec) {
        if (path.includes('/zones/')) {
            cmd += '--zone ';
            cmd += findPathPart(path, 3) + ' ';
        } else if (path.includes('/regions/')) {
            cmd += '--region ';
            cmd += findPathPart(path, 3) + ' ';
        } else if (includeGlobal && path.includes('/global/')) {
            cmd += '--global ';
        }
    }

    cmd += name;
    cmd += ' --quiet';

    return cmd;
}

function deleteNetwork(name, project = 'unused') {
    tryDeletePath(`projects/${project}/global/networks/${name}`);
}

const args = process.argv.slice(2);

for (let network of args) {
    deleteNetwork(network);
}
