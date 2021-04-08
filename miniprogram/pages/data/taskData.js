var task = {
  // 通用字段
  title: '背单词',         // string，任务描述
  typeid: 0,              // number，任务类型，0日常，1主线，2支线
  difficulty: 0,          // number，任务难度，0简单，1普通，2中等，3困难
  due: '2019-05-27',      // string，任务截止时间，使用new Date().Format('yyyy-MM-dd')初始化
  count: 1,               // number, 主线支线默认1次，日常任务默认无限次0，可选填次数
  checkcount: 0,          // number, 完成次数，默认0

  // 以下字段创建自动初始化
  lastwork: null,         // string，上次完成时间，初始化null

  // 以下属性用于判断任务的状态，有没有赋初值不影响后续使用
  status: {
    finished: false,      // 任务是否完成，初始化false
    expired: false,       // 任务是否过期，初始化false
    today: false,         // 今日是否完成，初始化false
  }
}