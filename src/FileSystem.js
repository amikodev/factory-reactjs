/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2021 Prihodko Dmitriy - asketcnc@yandex.ru
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


/**
 * Файловая система FileSystem
 * @link https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 * @link https://wicg.github.io/file-system-access/
 */
function FileSystem(){

    const _this = this;

    /**
     * Сканирование файловой структуры
     */
    const scanFileSystem = async () => {
        const root = await navigator.storage.getDirectory();

        const scan = async (dirHandle) => {
            let entries = [];
            for await (let [name, handle] of dirHandle.entries()){
                if(handle.kind === 'file'){
                    entries.push({name, kind: handle.kind, handle});
                } else if(handle.kind === 'directory'){
                    entries.push({name, kind: handle.kind, handle, childs: await scan(handle)});
                }
            }
            return entries;
        }
        let entries = scan(root);
        return entries;
    }

    /**
     * Визуализация файловой структуры
     */
    const visualiseFileSystem = async () => {
        const root = await navigator.storage.getDirectory();

        const ch = " ∟  ";

        const scan = async (dirHandle, level) => {
            let entries = [];
            for await (let [name, handle] of dirHandle.entries()){
                if(handle.kind === 'file'){
                    const file = await handle.getFile();
                    entries.push(ch.repeat(level)+`${name}; size=${file.size}`);
                } else if(handle.kind === 'directory'){
                    let childs = await scan(handle, level+1);
                    entries.push(ch.repeat(level)+'['+name+'] ('+childs.length+')');
                    if(childs.length > 0){
                        entries.push(...childs);
                    } else{
                        entries.push(ch.repeat(level+1) + ' -> dir empty');
                        
                    }
                }
            }
            return entries;
        }
        let entries = await scan(root, 0);
        return entries.join("\n");
    }

    /**
     * Получение директории или файла
     */
    const getEntryHandle = async (path) => {

        path = path.replace(/^\//, '');
        let needTree = path.split('/');

        const root = await navigator.storage.getDirectory();
        if(path === ''){
            return root;
        }

        const scan = async (dirHandle, level) => {
            let entry = null;
            if(level >= needTree.length)
                return null;

            let needName = needTree[level];
            for await (let [name, handle] of dirHandle.entries()){
                if(handle.kind === 'file'){
                    if(name === needName){
                        return handle;
                    }
                } else if(handle.kind === 'directory'){
                    if(name === needName){
                        if(level === needTree.length-1){
                            entry = handle;
                        } else{
                            entry = await scan(handle, level+1);
                        }
                        return entry;
                    }
                }
            }
            return entry;
        }
        let entry = await scan(root, 0);
        return entry;
    }

    /**
     * Определение существования файла
     */
    const getFileExists = async (path) => {
        const handle = await getEntryHandle(path);
        return handle !== null && handle.kind === 'file';
    }

    /**
     * Чтение файла
     * @return String
     */
    const readFile = async (filePath) => {
        let content = null;
        let entry = await getEntryHandle(filePath);
        if(entry !== null){
            let file = await entry.getFile();
            content = await file.text();
        }
        return content;
    }

    /**
     * Чтение файла
     * @return ArrayBuffer
     */
    const readFileArrayBuffer = async (filePath) => {
        let content = null;
        let entry = await getEntryHandle(filePath);
        if(entry !== null){
            let file = await entry.getFile();
            content = await file.arrayBuffer();
        }
        return content;
    }

    /**
     * Запись в файл
     */
    const writeFile = async (filePath, content) => {

        filePath = filePath.replace(/^\//, '');
        let needTree = filePath.split('/');
        let fnames = needTree.splice(-1, 1);

        if(fnames.length === 1){
            let fname = fnames[0];

            let path = needTree.join('/');

            let dirHandle = await getEntryHandle(path);
            if(dirHandle !== null){
                const fileHandle = await dirHandle.getFileHandle(fname, {create: true});
                const writableStream = await fileHandle.createWritable({keepExistingData: false});
                await writableStream.write(content);
                await writableStream.close();
            }
        }
    }

    /**
     * Создание директории
     */
    const createDir = async (path) => {
        path = path.replace(/^\//, '');
        let needTree = path.split('/');
        let entryNames = needTree.splice(-1, 1);

        let newDirHandle = null;

        if(entryNames.length === 1){
            let entryName = entryNames[0];

            let path = needTree.join('/');

            let dirHandle = await getEntryHandle(path);
            if(dirHandle !== null){
                // await dirHandle.removeEntry(entryName, {recursive: true});
                newDirHandle = await dirHandle.getDirectoryHandle(entryName, {create: true});
            }
        }

        return newDirHandle;
    }

    /**
     * Удаление директории или файла
     */
    const removeEntry = async (path) => {
        path = path.replace(/^\//, '');
        let needTree = path.split('/');
        let entryNames = needTree.splice(-1, 1);

        if(entryNames.length === 1){
            let entryName = entryNames[0];

            let path = needTree.join('/');

            let dirHandle = await getEntryHandle(path);
            if(dirHandle !== null){
                await dirHandle.removeEntry(entryName, {recursive: true});
            }
        }
    }




    const apiContext = {
        scanFileSystem, visualiseFileSystem, 
        getEntryHandle, 
        getFileExists, readFile, readFileArrayBuffer, writeFile,
        createDir, removeEntry, 
    };

    Object.keys(apiContext).map(name => _this[name] = apiContext[name]);

    return apiContext;
}

export default FileSystem;
