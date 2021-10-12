const glob = require("glob")
const fs = require('fs');


async function main() {
    let moduleFileFileList = await getModuleFilieList('D://code/brochure/src', './common/service/modules/*.js')
    let interfaceList = await getServeList(moduleFileFileList);
    let VueFileList = await getFileList('./*/**/*.vue')
    let jsFileList = await getFileList('./common/mixins/**/*.js')
    VueFileList = VueFileList.map(item => {
        return {
            key: item,
            value: ''
        }
    })
    jsFileList = jsFileList.map(item => {
        return {
            key: item,
            value: ''
        }
    })
    await readFileByKey(VueFileList);
    await readFileByKey(jsFileList);


    interfaceList = interfaceList.map(v => {
        return {
            key: v,
            arr: []
        }
    })
    interfaceList.forEach(interface => {
        interface.arr.push(
            ...VueFileList.filter(vue => {
                return vue.value.indexOf(`${interface.key}`) !== -1
            }).map(item => item.key))

        interface.arr.push(
            ...jsFileList.filter(js => {
                return js.value.indexOf(`${interface.key}`) !== -1
            }))
    })

    const aaa = interfaceList.filter(v => !v.arr.length)
    process.chdir(__dirname)
    fs.writeFile('./manifest.json', JSON.stringify(aaa), (err) => {
        console.log(err);
    })
}



//获取模块文件列表
function getModuleFilieList(moduleBaseName, moduleName) {
    process.chdir(moduleBaseName)
    return new Promise(relove => {
        glob(moduleName, (er, files) => {
            relove(files)
        })
    })
}
//获取接口列表
function getServeList(fileList) {
    return new Promise(async r => {
        let interfaceArr = [];
        for (item of fileList) {
            interfaceArr.push(...await getIntefaceList(item))
        }
        r(interfaceArr)
    })

}
//获取文件，提取接口信息
function getIntefaceList(parentfile) {
    return new Promise(r => {
        fs.readFile(parentfile, 'utf8', (err, file) => {
            let notindex = parentfile.endsWith('index.js')
            if (!notindex) {
                let str = file.replace(/export default/, '').replace(/\/\*[^]*?\*\//g, "").replace(/\/\/.*/g, '').replace(/\s+/g, '')
                let obj = eval(`(function(){ return ${str}})()`)
                let interfaceKeys = Object.keys(obj);
                r(interfaceKeys)
            } else {
                r([])
            }
        })
    })
}



//读取文件
function getFileList(fileName) {
    return new Promise(resolve => {
        glob(fileName, (er, files) => {
            resolve(files)
        })
    })
}

//读取文件,将文件名当成key,文件内容当成value
async function readFileByKey(files) {
    for (const item of files) {
        let result = await new Promise(r => {
            fs.readFile(item.key, 'utf-8', (err, data) => r(data));
        })
        item.value = result;
    }
}

main()
