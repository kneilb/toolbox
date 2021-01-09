const { exec } = require("child_process");

let toDelete = [];

function tryDelete(cmd, path='') {
    exec (cmd, (error, stderr, stdout) => {
        if (error) {
            if (path.length === 0) {
                path = findObjectPath(error.message);
            }
            toDelete.push(path);
            const userPath = findUserPath(error.message);
            let msg = `Failed to delete: ${path}`
            if (userPath) {
                msg += ` <- ${userPath}`;
            }
            console.log(msg);
            if (userPath.length === 0) {
                console.log(`Unexpected error: ${error.message}`);
                return;
            }
            tryDeletePath(userPath);
            return;
        }
        console.log(`Successfully deleted ${path}`);
        while (toDelete.length !== 0) {
            const path = toDelete.pop();
            tryDeletePath(path);
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
    return err.slice(found + searchFor.length).replace(/[' ]/g, '');
}

function findObjectPath(err) {
    const start = err.indexOf(`\'`);
    const end = err.indexOf('\'', start + 1);
    if (start < 0 || end < 0) {
        return '';
    }
    return err.slice(start, end).replace(/[' ]/g, '');
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
    let includeGlobal = true;

    switch (type) {
        case 'addresses':
            cmd += 'addresses delete ';
            addLocationSpec = true;
            break;
        case 'firewalls':
            cmd += 'firewall-rules delete ';
            break;
        case 'routers':
            cmd += 'routers delete ';
            addLocationSpec = true;
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
        case 'subnetworks':
            cmd += 'networks subnets delete ';
            addLocationSpec = true;
            break;
        case 'networks':
                cmd += 'networks delete ';
                addLocationSpec = true;
                includeGlobal = false;
                break;
        default:
            console.warn(`Don't know how to delete ${type} - please teach me!`)
            return '';
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

tryDelete('gcloud compute networks delete ci-iphe-gcloud-855331 --quiet');
