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

import React from 'react';

import {v4 as uuidv4} from 'uuid';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import CircularProgress from '@material-ui/core/CircularProgress';


import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

import FolderOpenIcon from '@material-ui/icons/FolderOpen';

import CyrillicToTranslit from 'cyrillic-to-translit-js';

import {AppContext} from '../../AppContext';
import DialogModal from '../../DialogModal';
import ParamSide from '../../ParamSide';
import ToolPanel from './ToolPanel';
import { TOOL_PANEL_NAME_MAIN, TOOL_PANEL_NAME_RIGHT } from './ToolPanel';
import { TOOL_POINTER, TOOL_SELECT_MESH, TOOL_SELECT_GROUP_MESH, TOOL_ADD } from './ToolPanel';

import Vision3D from './Vision3D';
import { zeroPoint, zeroPoint3D } from './Vision3D';

// import { TYPE as TYPE_INITIAL_BLANK } from './cam/InitialBlank';
// import {
//     INITIAL_BLANK_TYPE_PLANE, INITIAL_BLANK_TYPE_BOX, INITIAL_BLANK_TYPE_CYLINDER,
// } from './cam/InitialBlank';
import CamObject from './cam/CamObject.ts';
import InitialBlank from './cam/InitialBlank.ts';
import { CAM_TYPE as TYPE_INITIAL_BLANK, Type as BlankType } from './cam/InitialBlank.ts';
import { Point3 } from './cam/CamObject.ts';
import { StlModel, StlModelLink } from './cam/StlModel.ts';

import AddComponent from './cam/AddComponent';
import { FormParamsBlank, FormParamsStlModel } from './cam/AddComponent';
import { FormInitialBlankTop } from './cam/params/FormInitialBlank';
import { FormStlModelLinkTop } from './cam/params/FormStlModelLink.tsx';
import { FormCamObjectTop } from './cam/params/FormCamObject.tsx';

import ProjectComponents from './cam/ProjectComponents';
import ProjectStlModels from './cam/ProjectStlModels';


import FileSystem from '../../FileSystem';


import GCode from '../../gcode/GCode';


import { withStyles } from '@material-ui/core/styles';
import Equipments from '../../Equipments';


// const TOOL_POINTER = 'pointer';
// const TOOL_SELECT_MESH = 'selectMesh';


// const toolPanelNames = [TOOL_POINTER, TOOL_SELECT_MESH];
// console.log(BlankType);

// let bl = new InitialBlank(BlankType.Cylinder);
// // console.log(bl);
// // bl.createTypeBox({x: 0, y: 0, z: 0});
// // bl.create({x: 0, y: 0, z: 0});
// // bl.create({radius: 100, height2: 300});
// console.log(bl);
// // console.log(bl.getDataForSave());


const useStyles = theme => ({

    root: {


    },
    visualContainer: {

        position: 'relative',

    },
    dialogCreateProject: {
        width: 400,
    },
    projectItem: {
        width: 300, 
        marginRight: 20,
        marginBottom: 20,
        float: 'left',
        backgroundColor: '#EEE',
        position: 'relative',

        '& > .MuiCardActions-root': {
            // height: 46
            backgroundColor: '#FFF',
            position: 'absolute',
            top: 12,
            right: 12,
        },

    },
    projectPageEdit: {
        float: 'right',
    },

    // actionsFixedHeight: {
    //     height: theme.spacing(5),

    //     '& .MuiDialogActions-root': {
    //         height: theme.spacing(5),

    //     },
    // },
    tabs: {
        flexGrow: 1,
        backgroundColor: '#FFD',

        // indicator: {
        //     backgroundColor: '#0F0',
        // },

        '& .MuiTab-root': {
            borderRight: '1px #DDA solid',
        },

        '& .MuiTabs-indicator': {
            backgroundColor: '#C96',
        }

    },
    topFormParams: {
        position: 'absolute',
        top: 84,
        left: 200,
    },


});



class GcodeGenerate extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        // this.getCamModule = this.getCamModule.bind(this);

        const { visionWidth, equipmentNames, item } = props;

        this.state = {

            co: {x: 0, y: 0},

            equipmentNames,
            equipmentFile: 'http://127.0.0.1:3003/models/mills/mill6.obj',
            equipmentNumber: 0,

            visionWidth,

            selectedSimulationPoints: null,
            simulationPoint: Object.assign({}, zeroPoint),

            userZeroPoint: Object.assign({}, zeroPoint), 
            currentPoint: Object.assign({}, zeroPoint),
            selectedPoint: Object.assign({}, zeroPoint, {x: '', y: '', z: '', a: '', b: '', c: ''}),

            // toolNameSelected: TOOL_POINTER,

            // showStlOpen: false,
            // stlFileName: '',

            showProjectsPage: true,
            showDialogCreateProject: false,
            dialogCreateProjectCaption: '',
            projectPageEdit: false,
            projectItems: [], 
            currentProjectItem: null,       // {name, caption, uuid, createTime, lastModifiedTime}

            showAddComponentPage: false,
            addComponentSelectedIndex: null,
            addComponentAvailCreate: false,

            camObject: null,

            tabs1Value: 0,
            saving: false,
            saved: false,

        };


        this.refVision3D = React.createRef();
        this.camModule = null;

        this.refAddComponent = React.createRef();
        this.refProjectComponents = React.createRef();
        this.refProjectStlModels = React.createRef();

        this.fs = new FileSystem();

        this.camProjectsListFileName = '/'+item.name+'/camProjectsList.dat';
        this.stlModelsFileName = '/'+item.name+'/stlModels.dat';

        this.stlModelList = [];


    }


    componentDidMount(){

        const psVals = ParamSide.API.readStorage(this.props.item.name+"-"+"params1", (name, value) => {
            if(value !== null){
                this.handleChangeValueParamSide(name, value);
            }
        });


        // let camProjects = localStorage.getItem(item.name+'_'+'camProjects') ?? '[]';
        // camProjects = JSON.parse(camProjects);
        // projectItems = camProjects

        (async () => {

            const fs = this.fs;
            let fileContent = (await fs.readFile(this.camProjectsListFileName)) ?? '[]';
            this.setState({projectItems: JSON.parse(fileContent)});

            // fileContent = (await fs.readFile(this.stlModelsFileName)) ?? '[]';
            // this.setState({projectStlModels: JSON.parse});

        })();

        this.updateStlModelList();


        // this.handleSelectTool(this.state.toolNameSelected);

        const vs = this.refVision3D.current.getVisionScene();
        let camModule = vs.getCamModule();

        const setCamModuleEvents = () => {

            camModule.onSelectObjects((list) => {

                // console.log(list);
                if(list.length === 1){
                    let l = list[0];

                    const { mesh, camObject } = l;

                    // console.log(l);

                    // let ud = mesh.userData;
                    // if(ud.type){

                    //     if(ud.type === TYPE_INITIAL_BLANK){
                    //         this.setState({camObject: null, camObjectType: null}, () => {
                    //             this.setState({camObject, camObjectType: ud.type});
                    //         });


                    //         // show MoveHelper
                    //     }

                    // }

                    // console.log(camObject instanceof InitialBlank);

                    // if(camObject instanceof InitialBlank){
                    if(camObject instanceof CamObject){
                        this.setState({camObject: null}, () => {
                            // console.log(camObject, camObject.params);
                            this.setState({camObject});
                        });
                    }


                } else if(list.length > 1){
                    console.log('selected objects more than one');
                    this.setState({camObject: null});

                } else{
                    console.log('clear select object');
                    this.setState({camObject: null});

                }

            });

            camModule.onSelectGroupMeshes((list) => {
                // console.log(list);

                if(list.length === 1){
                    let l = list[0];

                    // this.setState({showStlOpen: true});

                } else if(list.length > 1){
                    console.log('selected groups of meshes more than one');

                    // this.setState({showStlOpen: true});

                } else{
                    console.log('clear select groups of meshes');

                    // this.setState({showStlOpen: false});

                }



                // list.map((l) => {
                //     l.mesh.geometry.computeBoundingBox();
                //     // console.log(l.mesh.geometry.boundingBox);
                // });

            });

        }


        if(camModule === null){
            vs.onCamModuleReady((module) => {
                camModule = module;
                setCamModuleEvents();
                // console.log('currentProjectItem', this.state.currentProjectItem);
                this.camModule = camModule;

                let projectItem = this.state.currentProjectItem;

                // прочитать из сохранённого файла
                // let nameProject = this.props.item.name+'__'+projectItem.name;
                // let fname = nameProject+'.dat';
                const fname = '/'+this.props.item.name+'/camProjects/'+projectItem.uuid+'.dat';

                (async () => {
                    const fs = new FileSystem();
                    let fileContent = await fs.readFile(fname);
                    // console.log(fileContent);
                    let loadedData = JSON.parse(fileContent);
    
                    if(camModule !== null){
                        camModule.setCurrentProject(projectItem, loadedData);
                    }
                })();
    
                camModule.setProjectComponents( this.refProjectComponents.current );
                camModule.setProjectStlModels( this.refProjectStlModels.current );
                
            });
        } else{
            setCamModuleEvents();
        }

    }

    componentWillUnmount(){

        const vs = this.refVision3D.current.getVisionScene();
        vs.setAnimateEnabled(false);

        // console.log('componentWillUnmount');

        // this.setState({mounted: false});

    }

    // getCamModule(){
    //     return this.camModule;
    // }

    /**
     * Обновление списка STL моделей
     */
    updateStlModelList(){

        const { item } = this.props;

        (async () => {

            const fs = this.fs;
            let fileContent = (await fs.readFile(this.stlModelsFileName)) ?? '[]';
            // this.setState({projectItems: JSON.parse(fileContent)});

            // fileContent = (await fs.readFile(this.stlModelsFileName)) ?? '[]';

            let existUuids = {};
            this.stlModelList.forEach(el => {
                existUuids[el.uuid] = null;
            });

            const fileData = JSON.parse(fileContent);
            fileData.forEach(el => {
                const { name, caption, uuid } = el;
                if(Object.keys(existUuids).indexOf(uuid) === -1){
                    const model = new StlModel();
                    model.fname = '/'+item.name+'/models/stl/'+uuid+'.dat';
                    model.name = name;
                    model.caption = caption;
                    model.uuid = uuid;
                    this.stlModelList.push(model);
                    this.refProjectStlModels.current.addModel(model);
                }
            });

            
        })();

    }

    /**
     * Изменение значения параметра
     * @param {string} name имя параметра
     * @param {string} value значение параметра
     */
     handleChangeValueParamSide(name, value){
        let co = this.state.co;
        switch(name){
            case 'coX':
                co.x = Number(value);
                this.setState({ co });
                break;
            case 'coY':
                co.y = Number(value);
                this.setState({ co });
                break;
            case 'eqFile':
                this.setState({ equipmentFile: (value)});
                break;
            case 'eqNumber':
                this.setState({ equipmentNumber: (value)});
                break;
            default:
                break;
        }

    }

    handleSelectTool(panelName, toolName){
        this.setState({toolNameSelected: toolName});

        const vs = this.refVision3D.current.getVisionScene();
        const camModule = vs.getCamModule();

        if(panelName === TOOL_PANEL_NAME_MAIN){
            switch(toolName){
                case TOOL_POINTER:
                case TOOL_SELECT_MESH:
                case TOOL_SELECT_GROUP_MESH:
                    camModule.selectPanel1Tool(panelName, toolName);
                    break;
                default:
                    break;
            }
        } else if(panelName === TOOL_PANEL_NAME_RIGHT){
            switch(toolName){
                case TOOL_ADD:
                    this.setState({showAddComponentPage: true});
                    break;
                default:
                    break;
            }
        }
    }

    // /**
    //  * Нажатие на кнопку открытия STL файла 
    //  */
    // handleStlOpenClick(event){
    //     const vs = this.refVision3D.current.getVisionScene();
    //     let camModule = vs.getCamModule();

    //     if(window.File && window.FileReader && window.FileList && window.Blob){
    //         let files = event.target.files;

    //         if(files.length > 0){
    //             // открытие файла
    //             let file = files[0];
    //             this.setState({stlFileName: file.name});
                
    //             var reader = new FileReader();
    //             reader.onload = (e) => {
    //                 const arrayBuffer = e.target.result;
    //                 // размещение прочитанного stl файла на выбранных поверхностях
    //                 camModule.applyStlToSelectedFromArrayBuffer(arrayBuffer);
    //                 this.setState({stlFileName: ''});
    //             }

    //             // чтение файла
    //             reader.readAsArrayBuffer(file);    
    //         }
    //     } else {
    //         console.warn('The File APIs are not fully supported in this browser.');
    //     }        
    // }

    handleCreateProjectSaveClick(event){

        let caption = this.state.dialogCreateProjectCaption;

        const cyrillicToTranslit = new CyrillicToTranslit();
        
        let name = cyrillicToTranslit
            .transform(caption, '_')
            .toLowerCase()
            .replace(/[^0-9a-z\-]/g, '_')
            .replace(/^[^a-z]*(?!a-z)/g, '')
            .concat('_')
            .concat(new Date().getTime())
        ;
        // console.log(`create project: ${caption} : ${name}`);

        if(name !== ''){
            this.setState({
                showDialogCreateProject: false, 
                dialogCreateProjectCaption: '',
            });
            this.createProject(name, caption);
        }

    }

    /**
     * Создание компонента
     */
    handleAddComponentSaveClick(event){
        this.refAddComponent.current.create();
        this.setState({showAddComponentPage: false});
    }

    /**
     * Создание нового проекта
     * @param String name Имя
     * @param String caption Название
     */
    createProject(name, caption){
        const { item } = this.props;

        const uuid = uuidv4().toUpperCase();

        const createTime = new Date().getTime();
        const lastModifiedTime = createTime;

        let projectItems = [...this.state.projectItems];
        let projectItem = {name, caption, uuid, createTime, lastModifiedTime};
        projectItems.push(projectItem);

        (async () => {

            // const camProjectsListFileName = '/'+item.name+'/camProjectsList.dat';
            // const stlModelsFileName = '/'+item.name+'/stlModels.dat';

            const fs = this.fs;
            // const fs = new FileSystem();
            // let handleDirProject = await fs.getEntryHandle('/'+item.name);
            // if(handleDirProject === null){
            //     handleDirProject = await fs.createDir('/'+item.name);

            // } else{

            // }

            const stlItems = [];

            await fs.createDir('/'+item.name);
            await fs.createDir('/'+item.name+'/models');
            await fs.createDir('/'+item.name+'/models/stl');
            await fs.createDir('/'+item.name+'/camProjects');

            await fs.writeFile(this.camProjectsListFileName, JSON.stringify(projectItems));

            if(!(await fs.getFileExists(this.stlModelsFileName))){
                await fs.writeFile(this.stlModelsFileName, JSON.stringify(stlItems));
            }


            const fname = '/'+item.name+'/camProjects/'+projectItem.uuid+'.dat';
            await fs.writeFile(fname, JSON.stringify([]));


        })();



        // localStorage.setItem(item.name+'_'+'camProjects', JSON.stringify(projectItems));
        this.setState({
            projectItems,
            currentProjectItem: projectItem,
            showProjectsPage: false,
        }, () => {

            const vs = this.refVision3D.current.getVisionScene();
            let camModule = vs.getCamModule();

            if(camModule !== null){
                // console.log('currentProjectItem', projectItem);
                camModule.setCurrentProject(projectItem, null);
            }

            // console.log(camModule);
    
        });
    }

    /**
     * Удаление проекта
     * @param String name Имя
     */
    removeProject(name){
        const { item } = this.props;

        let projectItems = [...this.state.projectItems];
        let projectItem = projectItems.filter(el => el.name === name)[0];
        if(window.confirm(('Вы уверены, что хотите удалить проект "'+projectItem.caption+'"?'))){
            projectItems = projectItems.filter(el => el.name !== name);

            (async () => {

                const fs = this.fs;

                await fs.writeFile(this.camProjectsListFileName, JSON.stringify(projectItems));

                const fname = '/'+item.name+'/camProjects/'+projectItem.uuid+'.dat';
                await fs.removeEntry(fname);

            })();

            // localStorage.setItem(item.name+'_'+'camProjects', JSON.stringify(projectItems));


            this.setState({projectItems});
        }
    }

    selectCurrentProject(projectItem){

        // const { item } = this.props;

        this.setState({
            currentProjectItem: projectItem,
            showProjectsPage: false,
            projectPageEdit: false,
        }, () => {

            const vs = this.refVision3D.current.getVisionScene();
            let camModule = vs.getCamModule();

            // прочитать из сохранённого файла
            // let nameProject = this.props.item.name+'__'+projectItem.name;
            // let fname = nameProject+'.dat';
            const fname = '/'+this.props.item.name+'/camProjects/'+projectItem.uuid+'.dat';

            (async () => {
                const fs = this.fs; // new FileSystem();
                let fileContent = await fs.readFile(fname);
                // console.log(fileContent);
                let loadedData = JSON.parse(fileContent);

                if(camModule !== null){
                    camModule.setCurrentProject(projectItem, loadedData);
                }
            })();
    
        });
    }

    /**
     * Обновление списка STL моделей
     */
    handleStlModelAdded(data){
        this.updateStlModelList();
    }

    handleStlModelsMenuClick(event, stlModel, itemName){

        const { item } = this.props;

        const vs = this.refVision3D.current.getVisionScene();
        let camModule = vs.getCamModule();

        if(itemName === 'addToSelected'){
            camModule.applyStlToSelected(stlModel);
        }

    }    

    render(){

        const { item, classes } = this.props;
        const { userZeroPoint, currentPoint, simulationPoint, selectedPoint, co, projectItems, currentProjectItem } = this.state;
        const { camObject } = this.state;

        let rnd = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        let stlOpenID = 'stlOpen_'+(new Date().getTime())+'_'+rnd;

        return (
            <div className={classes.root}>
                
                <div style={{display: this.state.showProjectsPage?'block':'none'}}>
                    
                    <Button variant="contained" color="primary" onClick={e => this.setState({showDialogCreateProject: true})}>
                        {('Создать проект')}
                    </Button>

                    {!(projectItems === null || projectItems.length === 0) &&
                    <Button variant="contained" className={classes.projectPageEdit} onClick={e => this.setState({projectPageEdit: !this.state.projectPageEdit})}>
                        {('Редактировать')}
                    </Button>
                    }

                    <hr/>

                    {(projectItems === null || projectItems.length === 0) &&
                        <i>{('Пусто')}</i>
                    }

                    {projectItems.map(el => {
                        return (
                            <Card key={el.name} className={classes.projectItem}>
                                <CardActionArea onClick={e => this.selectCurrentProject(el)}>
                                    <CardContent>
                                        <Typography variant="h5" component="h2">
                                            {el.caption}
                                        </Typography>
                                        <Typography color="textSecondary">
                                            {el.name}
                                        </Typography>
                                        <Typography variant="caption" component="div">
                                            {('Время создания')}: {new Date(el.createTime).toLocaleString('ru-RU')} <br/>
                                            {('Время изменения')}: {new Date(el.lastModifiedTime).toLocaleString('ru-RU')}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                                {this.state.projectPageEdit &&
                                    <CardActions>
                                        <Button size="small" color="secondary" onClick={e => this.removeProject(el.name)}>
                                            {('Удалить')}
                                        </Button>
                                    </CardActions>
                                }
                            </Card>
                        );
                    })}

                    <DialogModal
                        caption={('Новый проект')}
                        fullWidth={false}
                        open={this.state.showDialogCreateProject}
                        component={
                            <div className={classes.dialogCreateProject}>
                                
                                <TextField autoFocus={true} fullWidth required type="text" margin="dense"
                                    variant="outlined" label={('Название проекта')}
                                    onChange={(e) => this.setState({dialogCreateProjectCaption: e.target.value})}
                                />

                            </div>
                        }
                        saveCaption={('Создать')}
                        onSave={(e) => this.handleCreateProjectSaveClick(e)}
                        onClose={() => { this.setState({showDialogCreateProject: false}); }}
                    />
                </div>



                <div style={{display: !this.state.showProjectsPage?'block':'none'}}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={8} lg={8}>
                            {this.state.visionWidth !== null &&
                            <div className={classes.visualContainer}>
                                <Vision3D
                                    ref={this.refVision3D}
                                    // width={Math.min(500, this.state.visionWidth-50)}
                                    // width={1300}
                                    width={1200}
                                    height={900}

                                    X={simulationPoint.x}
                                    Y={simulationPoint.y}
                                    Z={simulationPoint.z}
                                    A={simulationPoint.a}
                                    B={simulationPoint.b}
                                    C={simulationPoint.c}
                                    coX={co.x}
                                    coY={co.y}
                                    equipmentFile={this.state.equipmentFile}
                                    equipmentNumber={this.state.equipmentNumber}
                                    
                                    // onChangePointSelected={this.handleChangePointSelected}

                                    showHead={false}
                                    // showHead={this.state.toolNameSelected === TOOL_SELECT_MESH}
                                    camModuleEnabled={true}

                                    needAnimate={!this.state.showProjectsPage && this.props.needVisionAnimate}
                                />

                                <ToolPanel onSelectTool={(panelName, toolName) => this.handleSelectTool(panelName, toolName)} />

                                {/* <FormInitialBlankTop subType={INITIAL_BLANK_TYPE_BOX} /> */}
                                {camObject !== null &&
                                <>
                                    <div className={classes.topFormParams}>
                                    {camObject instanceof InitialBlank &&
                                    <>
                                        <FormInitialBlankTop 
                                            subType={camObject.type} 
                                            params={camObject.params}
                                            onChange={params => camObject.setParams(params)}
                                        />
                                    </>
                                    }

                                    {camObject instanceof StlModelLink &&
                                    <>
                                        <FormStlModelLinkTop
                                            params={camObject.params}
                                            onChange={params => camObject.setParams(params)}
                                        />
                                    </>
                                    }

                                    {(camObject instanceof CamObject && !(
                                        camObject instanceof InitialBlank ||
                                        camObject instanceof StlModelLink
                                    )) &&
                                    <>
                                        <FormCamObjectTop
                                            params={camObject.params}
                                            onChange={params => camObject.setParams(params)}
                                        />
                                    </>
                                    }

                                    </div>
                                </>
                                }


                            </div>
                            }
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>

                            <Button variant="contained" onClick={e => this.setState({
                                showProjectsPage: true,
                                currentProjectItem: null,
                            })}>
                                {('Проекты')}
                            </Button>

                            {currentProjectItem !== null &&
                            <Typography variant="h6" component="span">
                                {currentProjectItem.caption}
                            </Typography>
                            }

                            <hr/>


                            <Tabs
                                className={classes.tabs}
                                // orientation="vertical"
                                variant="scrollable"
                                value={this.state.tabs1Value}
                                // indicatorColor='primary'
                                onChange={(e, newValue) => this.setState({tabs1Value: newValue})}
                            >
                                <Tab label={('Компоненты')} />
                                <Tab label={('Модели')} />
                            </Tabs>

                            <div hidden={!(this.state.tabs1Value === 0)}>
                                <ProjectComponents
                                    ref={this.refProjectComponents}
                                    // test:
                                    onComponentClick={(event, camObject) => {

                                        const vs = this.refVision3D.current.getVisionScene();
                                        let camModule = vs.getCamModule();

                                        camModule.selectObject(camObject, 'over');
                                        camModule.selectObject(camObject);
                                
                                        // if(object instanceof InitialBlank){
                                        //     this.setState({camObject: null}, () => {
                                        //         // console.log(camObject, camObject.params);
                                        //         this.setState({camObject: object});

                                        //     });
                                        // }
                                    }}
                                    onSupportObjectClick={(event, camSupportObject) => {
                                        // console.log({event, currentTarget: event.currentTarget, camSupportObject});
                                    }}
                                />
                            </div>
                            <div hidden={!(this.state.tabs1Value === 1)}>
                                <ProjectStlModels
                                    ref={this.refProjectStlModels}
                                    onMenuClick={(e, model, itemName) => this.handleStlModelsMenuClick(e, model, itemName)}
                                />
                            </div>


                            {/* <ProjectComponents
                                ref={this.refProjectComponents}
                            />

                            <hr/>

                            <ProjectStlModels
                                ref={this.refProjectStlModels}
                            /> */}

                            <hr/>

                            <Button variant="contained" onClick={e => {

                                this.setState({saving: true});

                                let data = this.refProjectComponents.current.getData();

                                // сохранить
                                // let nameProject = this.props.item.name+'__'+currentProjectItem.name;
                                // let fname = nameProject+'.dat';
                                const fname = '/'+item.name+'/camProjects/'+currentProjectItem.uuid+'.dat';

                                // console.log('save', data, JSON.stringify(data));
                                // return;

                                (async () => {
                                    const fs = this.fs; //new FileSystem();
                                    await fs.writeFile(fname, JSON.stringify(data));

                                    // обновление времени модификации
                                    let projItems = [...projectItems];
                                    projItems = projItems.map(item => {
                                        if(item.uuid === currentProjectItem.uuid){
                                            item.lastModifiedTime = new Date().getTime();
                                        }
                                        return item;
                                    });

                                    await fs.writeFile(this.camProjectsListFileName, JSON.stringify(projItems));

                                    this.setState({saving: false}, () => {
                                        this.setState({saved: true});
                                        window.setTimeout(() => {
                                            this.setState({saved: false});
                                        }, 1000);
                                    });

                                })();
                        
                            }}>{('Сохранить')}</Button>

                            {this.state.saving &&
                                <CircularProgress size={30} />
                            }
                            {this.state.saved &&
                                <>
                                {('Файл сохранён')}
                                </>
                            }

                            <hr/>

                            {camObject !== null &&
                            <>
                                {camObject instanceof InitialBlank &&
                                <>
                                    <Button variant="contained" onClick={e => {
                                        camObject.remove();
                                        this.setState({camObject: null});
                                    }}>{('Удалить')}</Button>
                                </>
                                }
                            </>
                            }


                            <hr/>

                            <Button variant="contained" onClick={e => {
                                const vs = this.refVision3D.current.getVisionScene();
                                let camModule = vs.getCamModule();
                                camModule.analyse();
                            }}>Analyse</Button>



                            {/* {camObject !== null &&
                            <>
                                {camObjectType === TYPE_INITIAL_BLANK &&
                                <>
                                    <FormParamsBlank
                                        fixSubType={camObject.getType()}
                                    />
                                    {JSON.stringify(camObject.getParams())}
                                </>
                                }
                            </>
                            } */}


                            {/* {this.state.showStlOpen &&
                            <>

                            <label htmlFor={stlOpenID}>
                                <input 
                                    type="file" 
                                    // accept="image/*" 
                                    id={stlOpenID} 
                                    name={stlOpenID} 
                                    style={{ display: 'none' }}
                                    onChange={e => this.handleStlOpenClick(e)}
                                />
                                <Button variant="contained" component="span">
                                    <FolderOpenIcon color='primary'/> &nbsp;
                                    {('STL')}
                                </Button>
                            </label>
                            {this.state.stlFileName}


                            </>
                            } */}

                            <br/>


                            <canvas id="testCanvas" width={500} height={500} style={{transform: 'scale(1, -1)', maxWidth: '100%'}} />

                        </Grid>
                    </Grid>
                </div>



                <DialogModal
                    caption={('Новый компонент')}
                    fullWidth={false}
                    open={this.state.showAddComponentPage}
                    component={
                        <AddComponent 
                            ref={this.refAddComponent}
                            camModule={this.camModule}
                            onAvailCreate={avail => this.setState({addComponentAvailCreate: avail})}
                            onStlModelAdded={(data) => this.handleStlModelAdded(data)}
                        />
                    }
                    saveCaption={this.state.addComponentAvailCreate ? ('Создать') : null}
                    classesActions={{root: 'fixedHeight'}}

                    onSave={(e) => this.handleAddComponentSaveClick(e)}
                    onClose={() => { this.setState({showAddComponentPage: false}); }}
                />



            </div>
        );
    }
    
}

GcodeGenerate.defaultProps = {
    item: {},                   // свойства оборудования

    visionWidth: null,
    equipmentNames: [],

    needVisionAnimate: true,
    
};

export default withStyles(useStyles)(GcodeGenerate);

