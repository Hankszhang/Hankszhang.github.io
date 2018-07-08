# Hanks's personal blog based on [Hexo](https://hexo.io/)

## 部署流程

1. node环境下全局安装hexo-cli：`$ npm install hexo-cli -g`
2. 如果还没有博客，可以执行`$ hexo init blogName`来新建一个博客
3. 配置github仓库库，讲本地项目与github仓库关联起来：
    - 建立github仓库，仓库名必须为：username.github.io
    - 在仓库中新建分支（如hexo等），并设置为主分支，将本地目录与username.github.ig仓库的heox分支关联起来，这样就可以将博客原文（hexo分支）与部署的静态文件（在master分支）保存在同一个项目中，便于多端同步
    - 在本地项目根目录的_config.yml文件底部配置如下：
    ```yml
    deploy:
      type: git
      repo: https://github.com/username/username.github.io.git
      branch: master    // 部署的分支必须为master分支，否则不能正确部署
    ```
4. 在博客根目录执行：`$ npm install`安装所需依赖
5. 启动本地服务，进行预览调试：`$ hexo server`，本地服务器地址为：http://localhost:4000
6. 新建文章：`$ hexo new 'pageName'`
6. 将编写的markdown页面编译成静态页面：`$ hexo generate`或`$ hexo g`
7. 部署bolg至github：`$ hexo deploy`，也可以使用`hexo generate -d`命令编译后自动部署