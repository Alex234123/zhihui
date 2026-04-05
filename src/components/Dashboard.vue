  dataService.subscribe('progressDetail', (data) => {
    if (data && Array.isArray(data)) {
      progressDetailList.value = data
    }
  })