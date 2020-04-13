package com.yanyan.personal.controller;

import com.yanyan.personal.service.yanyanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = {"/yanyan"})
public class yanyanController {
    @Autowired
    private yanyanService yanyanService;

    @ResponseBody
    @RequestMapping(value = {"/getSalary"},method = RequestMethod.GET)
    public List<Map<String, Object>> getSalary()  {
        List<Map<String, Object>> list = yanyanService.getSalary();
        return list;
    }
}
