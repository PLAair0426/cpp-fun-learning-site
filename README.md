# cpp-fun-learning-site

本仓库承载 `C++ 趣味学习网站` 项目。

当前仓库根目录保留项目主目录：

- `cpp-fun-learning-site/`

项目实际代码位于：

- `cpp-fun-learning-site/backend/`
- `cpp-fun-learning-site/frontend/`

本地启动：

```powershell
cd cpp-fun-learning-site/backend
make start
```

常用验证：

```powershell
cd cpp-fun-learning-site/backend
make test
```

默认启动后访问：

- Web: `http://localhost:3000`
- API Health: `http://localhost:18080/healthz`
- Worker Health: `http://localhost:18081/healthz`
