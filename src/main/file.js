import fs from 'fs'

export function getFile(path, ext) {
    return fs.readdirSync(path).filter(file => file.endsWith(ext));
}

export function readGameFile(path) {
    return fs.readFileSync(path, { encoding: 'binary' });
}