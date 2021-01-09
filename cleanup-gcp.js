const { exec } = require("child_process");

function tryDelete(cmd) {
    exec (cmd, (error, stderr, stdout) => {
        if (error) {
            console.log(`error: ${error.message}`);
            const userPath = findUserPath(error.message);
            if (userPath.length === 0) {
                return;
            }
            tryDeletePath(userPath);
            // TODO: automatic retry of this one, once we've deleted the whole hierarchy...!?
            //tryDelete(cmd);
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
    const endIndex = path.lastIndexOf('/') - 1;
    const startIndex = path.lastIndexOf('/', endIndex) + 1;
    return path.slice(startIndex, endIndex).replace(/[\/\n ]/g, '');
}

function getNameFromPath(path) {
    return path.slice(path.lastIndexOf('/') + 1, path.length).replace(/[\/\n ]/g, '');
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
    tryDelete(cmd);
    return true;
}

function generateCommand(path) {
    const project = getProjectFromPath(path);
    const type = getTypeFromPath(path);
    const name = getNameFromPath(path);
    console.log(`project: ${project}`);
    console.log(`type: ${type}`);
    console.log(`name: ${name}`);

    let cmd = 'gcloud compute ';

    if (type == 'firewalls') {
        cmd += 'firewall-rules delete ';
    } else if (type == 'routes') {
        cmd += 'routes delete '
    } else if (type == 'networkEndpointGroup') {
        cmd += 'network-endpoint-groups delete '
    } else {
        return '';
    }

    if (path.includes('/zones/')) {
        cmd += '--zone ';
        cmd += findPathPart(path, 3) + ' ';
    }

    cmd += name;
    cmd += ' --quiet';

    return cmd;
}

tryDelete('gcloud compute networks delete rich-dev21-west3 --quiet');

tryDelete('gcloud compute networks delete rich-dev22-west3 --quiet');
