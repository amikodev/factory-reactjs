
import '../../../fast-refresh-fix';
import FileSystem from '../../../FileSystem';


onmessage = (event) => {
    // console.log('ModelFile.worker from main', event);

    const { name, caption, uuid, file } = event.data;
    const { stlModelsFileName, stlFileName } = event.data;

    var reader = new FileReader();
    reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        // console.log(e);

        (async () => {

            const fs = new FileSystem();

            let fname = stlFileName;
            await fs.writeFile(fname, arrayBuffer);

            const stlModelsContent = await fs.readFile(stlModelsFileName);
            let stlModels = JSON.parse(stlModelsContent);
            stlModels.push({
                name, caption, uuid,
            });
            await fs.writeFile(stlModelsFileName, JSON.stringify(stlModels));

            postMessage({ stl: { name, caption, uuid } });
    
        })();
    
    }

    // чтение файла
    reader.readAsArrayBuffer(file);    

}
