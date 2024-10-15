import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import common from '../../lib/common/common.js';
import yaml from 'yaml'


//        『云雀🐦』图库管理器 v2.8
//        Github仓库地址：https://github.com/T060925ZX/Miao-Plugin-MBT/


function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
export class MiaoPluginMBT extends plugin {
    constructor() {
        super({
            name: '『云雀🐦』图库管理器 v1.0',
            dsc: '『云雀🐦』图库管理器',
            event: 'message',
            priority: 1000,
            rule: [
                {
                    reg: /^#(代理)?下载云雀$/,
                    fnc: 'GallaryDownload'
                },
                {
                    reg: /^#(强制)?更新云雀$/,
                    fnc: 'GallaryUpdate'
                },
                {
                    reg: /^#删除云雀$/,
                    fnc: 'DeleteGallary',
                    permission: "master"
                },
                {
                    reg: /^#(启用|禁用)云雀$/,
                    fnc: 'GalleryOption',
                    permission: "master"
                },
                {
                    reg: /^#(启用|禁用)官方立绘$/,
                    fnc: 'MihoyoSplashOption',
                    permission: "master"
                },
                {
                    reg: /^#云雀帮助$/,
                    fnc: 'GuHelp'
                },
                {
                    reg: /^#重置云雀$/,
                    fnc: 'RestartGuGuNiu',
                    permission: "master"
                },
                {
                    reg: /^#检查云雀$/,
                    fnc: 'CheckFolder'
                },           
                {     
                    reg: /^#查看(.*)$/,
                    fnc: 'FindRoleSplash'
                },
                {     
                    reg: /^#ban(加|删)(.*)$/,
                    fnc: 'BanRole',
                    permission: "master"
                },
                {     
                    reg: /^#ban列表$/,
                    fnc: 'BanRolelist',
                },
                {     
                    reg: /^#(确认)?净化云雀$/,
                    fnc: 'RemoveBadimages',
                },
                {     
                    reg: /^#云雀$/,
                    fnc: 'GuGuNiu',
                },
                {     
                    reg: /^#清理云雀缓存$/,
                    fnc: 'CC',
                }
            ]
        })
        this.task = {
            name: '『云雀🐦』定时更新任务',
            cron: '0 5 */15 * *',
            fnc: () => this.executeTask(),
            log: false
        }
        const currentFileUrl = import.meta.url;
        const currentFilePath = fileURLToPath(currentFileUrl);
        this.proxy = 'https://mirror.ghproxy.com/';  
        this.repositoryUrl = 'https://github.com/T060925ZX/Miao-Plugin-MBT/';

        this.localPath = path.resolve(path.dirname(currentFilePath), '../../resources/Miao-Plugin-MBT/');
        this.GitPath = path.resolve(path.dirname(currentFilePath), '../../resources/Miao-Plugin-MBT/.git/');

        this.copylocalPath = path.resolve(path.dirname(currentFilePath), '../../resources/Miao-Plugin-MBT/normal-character/');
        this.characterPath = path.resolve(path.dirname(currentFilePath), '../../plugins/miao-plugin/resources/profile/normal-character/');
        this.ZZZ_Plugin_copylocalPath = path.resolve(path.dirname(currentFilePath), '../../resources/Miao-Plugin-MBT/zzz-character/'); /////////
        this.ZZZ_Plugin_characterPath = path.resolve(path.dirname(currentFilePath), '../../plugins/ZZZ-Plugin/resources/images/panel/'); /////////

        this.GSaliasPath = path.resolve(path.dirname(currentFilePath), '../../plugins/miao-plugin/resources/meta-gs/character/');
        this.SRaliasPath = path.resolve(path.dirname(currentFilePath), '../../plugins/miao-plugin/resources/meta-sr/character/');
        this.ZZZ_Plugin_ZZZaliasPath = path.resolve(path.dirname(currentFilePath), '../../plugins/ZZZ-Plugin/defset/');  /////////

        this.GuPath = path.resolve(path.dirname(currentFilePath), '../../resources/GuGuNiu-Gallery/');
        this.JsPath = path.resolve(path.dirname(currentFilePath), '../../plugins/example/');
    }
    async GallaryDownload(e) {
        let downloadUrl;
        if (e.msg == '#下载云雀') {
            downloadUrl = this.repositoryUrl;
        } else if (e.msg == '#代理下载云雀🐦') {
            downloadUrl = this.proxy + this.repositoryUrl;
        }
        await e.reply('『云雀🐦』开始下载了', true);
        if (fs.existsSync(this.localPath)) {
            await e.reply('『云雀🐦』已存在，请勿重复下载！如有异常请手动执行#重置云雀');
            return;
        }
        try {
            await new Promise((resolve, reject) => {
                const process = exec(`git clone --depth=1 ${downloadUrl} ${this.localPath}`, { stdio: 'inherit' });
                process.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`git clone failed with code ${code}`));
                    }
                });
            });
            await this.CopyFolderRecursive(this.copylocalPath, this.characterPath);
            await this.CopyFolderRecursive(this.ZZZ_Plugin_copylocalPath, this.ZZZ_Plugin_characterPath); 
            await e.reply(`『云雀🐦』下载完成，载入喵喵中..`);
            fs.mkdirSync(this.GuPath, { recursive: true });
            this.CopyFolderRecursive(path.join(this.localPath,'GuGuNiu-Gallery'), this.GuPath);
            setTimeout(async () => {
                return e.reply(`『云雀🐦』成功进入喵喵里面！`);
            }, 20000);
            this.DeleteBanList()
            const sourceFile = path.join(this.localPath, '云雀图库下载器.js');
            const destFile = path.join(this.JsPath, '云雀图库下载器.js'); 
            await fs.promises.copyFile(sourceFile, destFile);
            await e.reply(`『云雀🐦』将每隔15天自动更新,包括Js`);
        } catch (error) {
            console.error('下载『云雀🐦』时出现错误:', error);
            let DowloadeErrorForward =[]
            DowloadeErrorForward.push(`下载『云雀🐦』时出现错误:\n ${error}`);
            if (error.message.includes('code 128')) {
                DowloadeErrorForward.push("检查网络连接：确保您的网络连接正常,有时候网络问题可能导致Git无法正常执行操作。");
            }
            if (error.message.includes('code 28')) {
                updateerrorforward.push("试着增加 Git 的 HTTP 缓冲区大小，这样可以帮助处理较大的数据传输在控制台输入以下命令");
                updateerrorforward.push("git config --global http.postBuffer 524288000");
            }
            if (error.message.includes('443')) {
                updateerrorforward.push("该报错可能是网络问题、被墙或访问被拒绝。");
            }
            let DownloadErrorGumsg = await common.makeForwardMsg(this.e, DowloadeErrorForward, '『云雀🐦』操作日志');
            await e.reply('下载『云雀🐦』时出现错误，请查看控制台日志！');
            setTimeout(async () => {
                this.reply(DownloadErrorGumsg);
            }, 2000);
        }
    }

    async GallaryUpdate(e) {
        try {
            if (!fs.existsSync(this.localPath)) {
                 await e.reply('『云雀🐦』未下载！', true);
                return true;
            }
            await e.reply('『云雀🐦』开始更新了', true);
            const gitPullOutput = await new Promise((resolve, reject) => {
                exec('git pull', { cwd: this.localPath }, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                });
            });
            if (/Already up[ -]to[ -]date/.test(gitPullOutput)) {
                await e.reply("『云雀🐦』已经是最新的啦");
                const gitLog = await new Promise((resolve, reject) => {
                    exec('git log -n 1 --date=format:"[%m-%d %H:%M:%S]" --pretty=format:"%cd %s"', { cwd: this.localPath }, (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(stdout);
                        }
                    });
                });
                await e.reply(`最近一次更新：${gitLog}`);
            }else {
                const gitLog = await new Promise((resolve, reject) => {
                    exec('git log -n 20 --date=format:"[%m-%d %H:%M:%S]" --pretty=format:"%cd %s"', { cwd: this.localPath }, (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(stdout);
                        }
                    });
                });
                const forwardMsg = [ `最近的更新记录：\n${gitLog}` ];
                const forwardMsgFormatted = await common.makeForwardMsg(this.e, forwardMsg, '『云雀🐦』更新成功');
                await this.reply(forwardMsgFormatted);
                await this.DeleteFilesWithGuKeyword();
                await new Promise((resolve, reject) => {
                    exec('git clean -df', { cwd: this.localPath }, (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
                const banListPath = path.join(this.GuPath, 'banlist.txt');
                let banList = fs.readFileSync(banListPath, 'utf8').split(';').filter(item => item.trim() !== '');

                const galleryConfigPath = path.join(this.GuPath, 'GalleryConfig.yaml');
                const galleryConfigContent = fs.readFileSync(galleryConfigPath, 'utf8');
                const galleryConfig = yaml.parse(galleryConfigContent);

                if (galleryConfig && galleryConfig['GGOP'] === 1) {
                    await this.CopyFolderRecursive(this.copylocalPath, this.characterPath);
                    await this.CopyFolderRecursive(this.ZZZ_Plugin_copylocalPath, this.ZZZ_Plugin_characterPath);
                }

                fs.mkdirSync(this.GuPath, { recursive: true });
                const sourceFile = path.join(this.localPath, 'GuGuNiu-Gallery', 'help.png');
                const destFile = path.join(this.GuPath, 'help.png');
                await fs.promises.copyFile(sourceFile, destFile);

                const sourceJSFile = path.join(this.localPath, '云雀图库下载器.js');
                const destJSFile = path.join(this.JsPath, '云雀图库下载器.js');
                await fs.promises.copyFile(sourceJSFile, destJSFile);
                
                if (galleryConfig && galleryConfig['Px18img-type'] === 0) {
                    R18_images.forEach(image => {
                        const fileName = `${image}.webp`;
                        if (!banList.includes(fileName)) {
                            banList.push(fileName);
                        }
                    });
                    fs.writeFileSync(banListPath, `${banList.join(';')};`, 'utf8')
                }

                this.DeleteBanList()
            }
        } catch (error) {
            console.error('更新『云雀🐦』时出现错误:', error);
            let updateerrorforward = [`更新『云雀🐦』时出现错误:\n${error.message}`];  
            if (error.message.includes('code 128')) {
                updateerrorforward.push("检查网络连接：确保您的网络连接正常，有时候网络问题可能导致 Git 无法正常执行操作。");
                updateerrorforward.push("也可能出现合并失败，可以尝试重置云雀");
            }
            if (error.message.includes('code 1')) {
                updateerrorforward.push("该报错是本地与仓库文件冲突，请手动重置咕咕牛后再尝试下载。");
            }
            if (error.message.includes('code 28')) {
                updateerrorforward.push("试着增加 Git 的 HTTP 缓冲区大小，这样可以帮助处理较大的数据传输在控制台输入以下命令");
                updateerrorforward.push("git config --global http.postBuffer 524288000");
            }
            if (error.message.includes('443')) {
                updateerrorforward.push("该报错可能是网络问题、被墙或访问被拒绝。");
            }
            let updaterrormsg = await common.makeForwardMsg(this.e, updateerrorforward, '『云雀🐦』更新失败');
            await this.reply('更新『云雀🐦』时出现错误，请查看日志！');
            setTimeout(async () => {
                await this.reply(updaterrormsg);
             }, 2000);
        }
    }    

    async GuHelp(e) {
        if (!fs.existsSync(this.GuPath)) {
            e.reply(segment.image("https://s2.loli.net/2024/06/28/LQnN3oPCl1vgXIS.png"))
            return true;
         }e.reply(segment.image(this.GuPath+'/help.png'))
      }

    async BanRole(e) {
        const banListPath = path.join(this.GuPath, 'banlist.txt');
        if (!fs.existsSync(banListPath)) {
            fs.writeFileSync(banListPath, '', 'utf8');
        }
        let message = e.raw_message || e.message || e.content;
    
        if (message.startsWith('#ban加')) {
            const match = message.match(/^#ban加(.+)/);
            if (!match) {
                await e.reply('请输入要添加到禁止列表的名称\n例如：#ban加花火Gu1', true);
                return true;
            }
    
            let inputRoleName = match[1].trim();
            let roleName = inputRoleName.replace(/Gu\d+$/, '').trim();
            let mainName = this.getMainRoleName(roleName); 
    
            if (mainName) {
                mainName = `${mainName}${inputRoleName.match(/Gu\d+$/)[0]}`;
                const fileName = `${mainName}.webp`;
                let banList = fs.readFileSync(banListPath, 'utf8').split(';').filter(item => item.trim() !== '');
    
                if (!banList.includes(fileName)) {
                    banList.push(fileName); 
                    fs.writeFileSync(banListPath, `${banList.join(';')};`, 'utf8'); 
                    await e.reply(`${fileName} 🚫已封禁`, true);
                    this.DeleteBanList();
                } else {
                    await e.reply(`${fileName} ❌️已存在`, true);
                }
            } else {
                await e.reply(`未找到角色：${roleName}`, true);
            }
        } else if (message.startsWith('#ban删')) {
            const match = message.match(/^#ban删(.+)/);
            if (!match) {
                await e.reply('请输入要从禁止列表中删除的名称\n例如：#ban删花火Gu1', true);
                return true;
            }
    
            let inputRoleName = match[1].trim();
            let roleName = inputRoleName.replace(/Gu\d+$/, '').trim();
            let mainName = this.getMainRoleName(roleName);
    
            if (mainName) {
                mainName = `${mainName}${inputRoleName.match(/Gu\d+$/)[0]}`;
                const fileName = `${mainName}.webp`;
                let banList = fs.readFileSync(banListPath, 'utf8').split(';').filter(item => item.trim() !== '');

                if (R18_images.includes(inputRoleName)) {
                    await e.reply(`${inputRoleName} ❌️已拒绝删除`, true);
                    return true;
                }
    
                if (banList.includes(fileName)) {
                    banList = banList.filter(item => item !== fileName);
                    fs.writeFileSync(banListPath, `${banList.join(';')}`, 'utf8');
                    await e.reply(`${fileName} ✅️已解禁`, true);
                    await this.CopyFolderRecursive(this.copylocalPath, this.characterPath);
                    await this.CopyFolderRecursive(this.ZZZ_Plugin_copylocalPath, this.ZZZ_Plugin_characterPath);
                } else {
                    await e.reply(`${fileName} ❌️不存在`, true);
                }
            } else {
                await e.reply(`未找到角色：${roleName}`, true);
            }
        }
    
        return true;
    }
    
    async CC(e) {e.reply("请使用#重置云雀",true)}

    async BanRolelist(e) {
        const banListPath = path.join(this.GuPath, 'banlist.txt');
        if (!fs.existsSync(banListPath)) {
            await e.reply('禁用文件不存在,已重新生成', true);
            fs.writeFileSync(banListPath, '', 'utf8');
            return true;
        }
        try {
            const fileContent = fs.readFileSync(banListPath, 'utf8').trim();
            if (fileContent === '') {
                await e.reply('封禁列表是空的', true);
                return true;
            }
            const banList = fileContent.split(';').map(item => item.trim()); 
            const uniqueBanList = [...new Set(banList)];
            const totalItems = uniqueBanList.length -1;
            const formattedBanList = uniqueBanList.map(item => item.replace(/\.webp$/, ''));
            const BanListforwardMsg = [];
            BanListforwardMsg.push(`当前已Ban的数量：${totalItems}张\n『#ban删花火Gu1』可以移除封禁`);
            BanListforwardMsg.push(formattedBanList.join('\n')); 
            const banListMsg = await common.makeForwardMsg(this.e, BanListforwardMsg, '封禁中的面板图列表');
            await e.reply(banListMsg);
            return true;
        } catch (error) {
            await e.reply('读取封禁文件时出现错误，请查看控制台日志', true);
            return true;
        }
    }

    async FindRoleSplash(e) {
        if (!fs.existsSync(this.localPath)) {
            await e.reply('『云雀🐦』未下载！', true);
            return true;
        }
    
        const match = e.msg.match(/^#查看(.+)$/);
        if (!match) {
            await e.reply('请输入正确的命令格式\n例如：#查看花火', true);
            return true;
        }
    
        let roleName = match[1].trim();
        roleName = this.getMainRoleName(roleName);
    
        const foldersONE = fs.readdirSync(this.copylocalPath);
        const foldersTWO = fs.readdirSync(this.ZZZ_Plugin_copylocalPath);
        const allFolders = [
            ...foldersONE.map(folder => path.join(this.copylocalPath, folder)), 
            ...foldersTWO.map(folder => path.join(this.ZZZ_Plugin_copylocalPath, folder))
        ];
    
        const matchedFolder = allFolders.find(folder => path.basename(folder).includes(roleName));
        if (!matchedFolder) {
            await e.reply(`未找到角色『${roleName}』`);
            return true;
        } 
    
        const files = fs.readdirSync(matchedFolder)
        .filter(file => /\.webp$/.test(file))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
    
        if (files.length === 0) {
            await e.reply(`『${path.basename(matchedFolder)}』文件夹下没有图片`, true);
            return true;
        }
    
        let checkrolename = `当前查看『${path.basename(matchedFolder)}』，有${files.length}张`;
        let RoleWebpPhotoList = [];
        RoleWebpPhotoList.push([`当前查看『${path.basename(matchedFolder)}』，有${files.length}张`]);
    
        const banListPath = path.join(this.GuPath, 'banlist.txt');
        const banListContent = fs.readFileSync(banListPath, 'utf-8');
        const filesToBan = banListContent.split(';').map(item => item.trim()).filter(item => item !== '');
    
        for (let i = 0; i < files.length; i++) {
            let fileName = files[i];
            const filePath = path.join(matchedFolder, fileName);
            const isBanned = filesToBan.includes(fileName);
            const isR18Image = R18_images.includes(fileName.replace('.webp', ''));
        
            if (isBanned && isR18Image) {
                fileName = `${fileName.replace('.webp', '')} ❌封禁🟢净化`;
            } else if (isBanned) {
                fileName = `${fileName.replace('.webp', '')} ❌封禁`;
            } else {
                fileName = `${fileName.replace('.webp', '')}`; 
            }
    
            RoleWebpPhotoList.push([`${i + 1}、${fileName}`, segment.image(`file://${filePath}`)]);
        }
    
        try {
            let RoleFindsuccessmsg = await common.makeForwardMsg(this.e, RoleWebpPhotoList, checkrolename);
            await e.reply(RoleFindsuccessmsg);
            if (!RoleFindsuccessmsg) {
                e.reply('发送失败,请私聊查看！', true);
            }
        } catch (err) {
            console.error(err);
            await e.reply(`发送 ${path.basename(matchedFolder)} 的列表时出现错误,请查看控制台日志`);
        }
    }
    

    async RemoveBadimages(e) {
        const galleryConfigPath = path.join(this.GuPath, 'GalleryConfig.yaml');
        const galleryConfigContent = fs.readFileSync(galleryConfigPath, 'utf8');
        const galleryConfig = yaml.parse(galleryConfigContent);

        if (e.msg == '#净化云雀') {

             e.reply("『云雀🐦』封禁高危面板图,净化无法解除需要你手动修改配置文件,下次更新依旧会延续净化,十分建议呢用#ban封禁",true)
             setTimeout(async () => {
                    e.reply("输入#确认净化云雀,进行下一步")               
             }, 3000);

            }else if (e.msg == '#确认净化云雀') {
                
                if (galleryConfig && galleryConfig['Px18img-type'] === 1 ) {

                await e.reply("好的,开始净化云雀🐦",true)
                const banListPath = path.join(this.GuPath, 'banlist.txt');
                if (!fs.existsSync(banListPath)) {
                    fs.writeFileSync(banListPath, '', 'utf8');
                }
                let banList = fs.readFileSync(banListPath, 'utf8').split(';').filter(item => item.trim() !== '');

                R18_images.forEach(image => {
                    const fileName = `${image}.webp`;
                    if (!banList.includes(fileName)) {
                        banList.push(fileName);
                    }
                });
                fs.writeFileSync(banListPath, `${banList.join(';')};`, 'utf8')
                this.DeleteBanList();

                galleryConfig['Px18img-type'] = 0;
                const newGalleryConfigContent = yaml.stringify(galleryConfig);
                fs.writeFileSync(galleryConfigPath, newGalleryConfigContent, 'utf8');
               
                setTimeout(async () => {
                    await e.reply(`净化完毕，绿色网络从你做起！`);
                  }, 10000);
                  } else if (galleryConfig && galleryConfig['Px18img-type'] === 0) {
                await e.reply("你已经净化过了,亲",true);
            }

        }
    }

    async GuGuNiu(e) {
            await e.reply("🐦");
            const stats = await fs.promises.stat(this.localPath);
            const creationTime = stats.birthtime.toISOString();
            await e.reply(`图库安装时间: ${creationTime}`);
            const gitLog = await new Promise((resolve, reject) => {
                exec('git log -n 50 --date=format:"[%m-%d %H:%M:%S]" --pretty=format:"%cd %s"', { cwd: this.localPath }, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                });
            });
    
            const uplogforwardMsg = [`最近的更新记录：\n${gitLog}`];
            const forwardMsgFormatted = await common.makeForwardMsg(this.e, uplogforwardMsg, '『云雀🐦』日志');
            await e.reply(forwardMsgFormatted);
    }
    
    async GalleryOption(e){
        const galleryConfigPath = path.join(this.GuPath, 'GalleryConfig.yaml');
        const galleryConfigContent = fs.readFileSync(galleryConfigPath, 'utf8');
        const galleryConfig = yaml.parse(galleryConfigContent);
        if (e.msg == '#启用云雀') {
            if (!fs.existsSync(this.localPath)) {
                await e.reply('『云雀🐦』未下载！', true);
                return;
             }
                await e.reply('『云雀🐦』启用中,请稍后...',true);
                await this.CopyFolderRecursive(this.copylocalPath, this.characterPath);
                await this.CopyFolderRecursive(this.ZZZ_Plugin_copylocalPath, this.ZZZ_Plugin_characterPath);
                await e.reply('『云雀🐦』重新进入喵喵里面！');
                setTimeout(async () => {
                    this.DeleteBanList()
                }, 2000);

                galleryConfig['GGOP'] = 1;
                const newGalleryConfigContent = yaml.stringify(galleryConfig);
                fs.writeFileSync(galleryConfigPath, newGalleryConfigContent, 'utf8');

        }else if (e.msg == '#禁用云雀') {
                await e.reply('『云雀🐦』禁用中,请稍后...',true);
                await this.DeleteFilesWithGuKeyword();
                await e.reply('『云雀🐦』已离开喵喵');

                galleryConfig['GGOP'] = 0;
                const newGalleryConfigContent = yaml.stringify(galleryConfig);
                fs.writeFileSync(galleryConfigPath, newGalleryConfigContent, 'utf8');
        }
    }

    async DeleteGallary(e){
        await e.reply('『云雀🐦』完全删除中,请稍后.....',true);
        await this.DeleteFilesWithGuKeyword();
        if (!fs.existsSync(this.localPath)) {
            return e.reply('『云雀🐦』已离开你的崽崽了！');
        }
        await fs.promises.rm(this.localPath, { recursive: true });
        console.log('『云雀🐦』图库删除成功！');
        return e.reply('『云雀🐦』已离开你的崽崽了！！');
    }

    async executeTask(){
        logger.info("[『云雀🐦』定时更新任务]：开始执行")
        const gitPullOutput = await new Promise((resolve, reject) => {
            exec('git pull', { cwd: this.localPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
        if (/Already up[ -]to[ -]date/.test(gitPullOutput)) {
            logger.info("[『云雀🐦』定时更新任务]：暂无更新内容")
        }else{
                await this.CopyFolderRecursive(this.copylocalPath, this.characterPath);
                await this.CopyFolderRecursive(this.ZZZ_Plugin_copylocalPath, this.ZZZ_Plugin_characterPath);

                fs.mkdirSync(this.GuPath, { recursive: true });
                const sourceFile = path.join(this.localPath, 'GuGuNiu-Gallery', 'help.png');
                const destFile = path.join(this.GuPath, 'help.png');
                await fs.promises.copyFile(sourceFile, destFile);

                const sourceJSFile = path.join(this.localPath, '云雀图库下载器.js');
                const destJSFile = path.join(this.JsPath, '云雀图库下载器.js');
                await fs.promises.copyFile(sourceJSFile, destJSFile);
                
                this.DeleteBanList();
                return logger.info("[『云雀🐦』定时更新任务]：执行完毕")
            }
        }
    

    async RestartGuGuNiu(e) {
        try { 
            if (!fs.existsSync(this.localPath)) {
                await e.reply('『云雀🐦』未下载！', true);
                return true;
            }
            await fs.promises.rm(this.localPath, { recursive: true });
            console.log('『云雀🐦』重置成功！');
            return e.reply('『云雀🐦』重置成功！');
        } catch (error) {
            console.error('重置『云雀🐦』时出现错误:', error);
            let rerrforward = [];
            rerrforward.push(`重置『云雀🐦』时出现错误:\n ${error.message}`);
            let restarterror = await common.makeForwardMsg(this.e, rerrforward, '『云雀🐦』重置失败');
            this.reply('『云雀🐦』重置失败，请查看控制台日志！');
            setTimeout(async () => {
                this.reply(restarterror);
            }, 2000);
        }
    }    

    async CheckFolder(e) {
        const gitPath = this.GitPath;
        const characterFolderPaths = [
            'normal-character',
            'zzz-character'
        ].map(folder => path.join(this.localPath, folder));
    
        if (!fs.existsSync(this.localPath)) {
            await e.reply('『云雀🐦』未下载！', true);
            return true;
        }
    
        let characterFolders = [];
    
        for (const folderPath of characterFolderPaths) {
            if (fs.existsSync(folderPath)) {
                const folders = fs.readdirSync(folderPath, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => path.join(folderPath, dirent.name));
                characterFolders = characterFolders.concat(folders);
            }
        }
    
        characterFolders = characterFolders.sort((a, b) => a.localeCompare(b));
        let totalCharacterCount = characterFolders.length;
        let CheckRoleforward = [];
        let RoleNumMessage = [];
        CheckRoleforward.push("---按A-Z字母排序---");
        let totalPanelImageCount = 0;
    
        for (const folderPath of characterFolders) {
            if (fs.existsSync(folderPath)) {
                const folder = path.basename(folderPath);
                const panelImages = fs.readdirSync(folderPath).filter(file => file.endsWith('.webp'));
                totalPanelImageCount += panelImages.length;
                const name = `${folder}：${panelImages.length}张`;
                CheckRoleforward.push(name);
            }
        }
    
        let totalSize = 0;
        for (const folderPath of characterFolderPaths) {
            totalSize += await this.getFolderSize(folderPath);
        }
    
        const formattedTotalSize = formatBytes(totalSize);
        const gitSize = await this.getFolderSize(gitPath);
        const gitAllSize = formatBytes(gitSize);
        const MBTSize = formatBytes(gitSize + totalSize);
        let checkmessage = `----『云雀🐦』----\n角色数量：${totalCharacterCount}名\n图片数量：${totalPanelImageCount}张\n图库容量：${formattedTotalSize}\nGit缓存容量：${gitAllSize}\n咕咕牛图库占用：${MBTSize}`;
        RoleNumMessage = CheckRoleforward.join('\n');
    
        await Promise.all([
            e.reply(checkmessage),
            (async () => {
                const msg = await common.makeForwardMsg(this.e, RoleNumMessage, '『云雀🐦』图库数量');
                await e.reply(msg);
            })()
        ]);
    }
    
    
    

    async MihoyoSplashOption(e) {
        if (e.msg == '#启用官方立绘') {
            await this.CopySplashWebp(this.SRaliasPath, this.characterPath);
            await this.CopySplashWebp(this.GSaliasPath, this.characterPath);
            return e.reply('官方立绘已经启用了',true);
        }else  if (e.msg == '#禁用官方立绘') {
            await this.DeleteGuSplashWebp(this.characterPath);
            return e.reply('官方立绘已经禁用了',true);
        }
    } 

    async DeleteBanList() {
        const banListPath = path.join(this.GuPath, 'banlist.txt');
    
        try {
    