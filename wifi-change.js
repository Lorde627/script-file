// 配置项 - 可根据需要修改
const CONFIG = {
  // 不需要代理的网络配置
  DIRECT_NETWORKS: [
    '627-5G',
    // 可以添加更多信任的网络
  ],
  // 特定网络的自定义模式
  CUSTOM_MODES: {
    // 'network_name': 'proxy-mode'
  },
  // 默认模式
  DEFAULT_MODE: 'rule',
  DIRECT_MODE: 'direct',
  // 存储键名
  STORAGE_KEY: 'current_wifi_ssid',
  LAST_CHANGE_KEY: 'last_network_change',
  // 防抖延迟 (毫秒)
  DEBOUNCE_DELAY: 1000
};

// 主函数
function main() {
  try {
    if (shouldChangeMode()) {
      const currentNetwork = getCurrentNetwork();
      const mode = determineMode(currentNetwork.ssid);
      
      setModeAndNotify(mode, currentNetwork);
      updateStoredNetwork(currentNetwork.ssid);
    }
  } catch (error) {
    console.log(`脚本执行错误: ${error.message}`);
    $notification.post('Surge', '网络切换脚本错误', error.message);
  }
}

// 获取当前网络信息
function getCurrentNetwork() {
  const wifi = $network.wifi;
  return {
    ssid: wifi ? wifi.ssid : null,
    displayName: wifi && wifi.ssid ? wifi.ssid : 'cellular'
  };
}

// 判断是否应该切换模式
function shouldChangeMode() {
  const currentNetwork = getCurrentNetwork();
  const storedSSID = $persistentStore.read(CONFIG.STORAGE_KEY) || '';
  const lastChange = parseInt($persistentStore.read(CONFIG.LAST_CHANGE_KEY) || '0');
  const now = Date.now();
  
  // 网络未变化
  if (storedSSID === (currentNetwork.ssid || '')) {
    return false;
  }
  
  // 防抖检查 - 避免频繁切换
  if (now - lastChange < CONFIG.DEBOUNCE_DELAY) {
    return false;
  }
  
  return true;
}

// 确定应使用的模式
function determineMode(ssid) {
  // 优先检查自定义模式
  if (ssid && CONFIG.CUSTOM_MODES[ssid]) {
    return CONFIG.CUSTOM_MODES[ssid];
  }
  
  // 检查是否为直连网络
  if (ssid && CONFIG.DIRECT_NETWORKS.includes(ssid)) {
    return CONFIG.DIRECT_MODE;
  }
  
  // 返回默认模式
  return CONFIG.DEFAULT_MODE;
}

// 设置模式并发送通知
function setModeAndNotify(mode, network) {
  $surge.setOutboundMode(mode);
  
  const title = 'Surge 网络切换';
  const subtitle = `网络: ${network.displayName}`;
  const body = `已切换到 ${getModeDisplayName(mode)} 模式`;
  
  $notification.post(title, subtitle, body);
  console.log(`${subtitle} - ${body}`);
}

// 获取模式显示名称
function getModeDisplayName(mode) {
  const modeNames = {
    'direct': '直连',
    'rule': '规则',
    'global': '全局代理'
  };
  return modeNames[mode] || mode;
}

// 更新存储的网络信息
function updateStoredNetwork(ssid) {
  $persistentStore.write(ssid || '', CONFIG.STORAGE_KEY);
  $persistentStore.write(Date.now().toString(), CONFIG.LAST_CHANGE_KEY);
}

// 执行主函数
main();

$done();
