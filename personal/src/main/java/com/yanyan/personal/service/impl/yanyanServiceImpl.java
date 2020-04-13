package com.yanyan.personal.service.impl;

import com.yanyan.personal.dao.yanyanMapper;
import com.yanyan.personal.service.yanyanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class yanyanServiceImpl implements yanyanService {
    @Autowired
    private yanyanMapper yanyanMapper;
    @Override
    public List<Map<String, Object>> getSalary() {
        List<Map<String, Object>> list = yanyanMapper.selectSalary();
        List<Map<String, Object>> relist = new ArrayList<>();
        int total = 0;
        for (int i = 0; i < list.size(); i++) {
            Map<String, Object> map = list.get(i);
            Map<String, Object> map2 = new HashMap<>();
            //时间
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            String createTime = sdf.format(map.get("createTime"));
            map2.put("createTime", createTime);
            if (Integer.valueOf(String.valueOf(map.get("updown")))==1){
                total = total + Integer.valueOf(String.valueOf(map.get("change")));
            }
            if (Integer.valueOf(String.valueOf(map.get("updown")))==0){
                total = total - Integer.valueOf(String.valueOf(map.get("change")));
            }
            map2.put("total", total);
            relist.add(map2);
        }
        return relist;
    }
}
