# jqGrid
jqGrid项目使用总结

最近项目中用jqGrid来实现页面中的表格数据，使用过程中感触颇多，总体发现jqGrid灵活性还是很好的，我使用过程中参考了API文档，感觉这个API文档挺全面的，文档地址为：
[jqGrid实例中文版](http://blog.mn886.net/jqGrid/) 

首先说一下项目的需求：<br>
type==0  AAA     status==0 正常    --可以变更为BBB<br>
type==1  BBB  status==0 正常 || status==1 未激活   --可以变更为AAA，可挂失<br>
status==4  已挂失  --只有已挂失的锁可以取消挂失

下面是我在项目中遇到问题的总结：1、2和3请在localhost环境打开index.html查看效果

### 1.onSelectRow的问题

```javascript
onSelectRow: function(rowid, status){
    if(status){
        //选中行时执行的操作
    }else{
        //取消选中行时执行的操作
    }    
}
```
我的项目中的需求是选中一行或者多行时，要根据每一行的某两个值判断是否可以点击上面的按钮，如果可以，某个按钮会变亮可点，如果不可以，某个按钮会变暗不可点，具体效果如图所示

![](https://github.com/FloweringVivian/jqGrid/blob/master/images/readme.jpg) 

onSelectRow有两个参数，rowid代表行id，status代表选中状态，选中时为true，取消选中时为false，所以我需要在选中行时把行的数据push到一个数组里，然后取消选中行时在数组里根据行id找到这条数据，然后删除，然后写一个方法来循环这个数组中的数据，进行按钮的是否可点击判断，方法如下：

```javascript
//控制按钮状态
function watchBtn(arrList){
  var toForeverBtn = false;
  var toActivationBtn = false;
  var lossBtn = false;
  var cancelLossBtn = false;
  if(arrList && arrList.length>0){
    for(var i=0;i<arrList.length;i++){
      if(arrList[i].type != 1 || arrList[i].status != 0){  //只有type==1 && status==0(BBB 正常)才能变更为AAA
        toForeverBtn = true;
      };
      if(arrList[i].type != 0 || arrList[i].status != 0){  //只有type==0 && status==0(AAA 正常)才能变更为BBB
        toActivationBtn = true;
      };
      if(arrList[i].type != 1 || (arrList[i].status != 0 && arrList[i].status != 1)){  //只有type==1 && (status==0 || status==1)(BBB 正常 未激活)才能挂失
        lossBtn = true;
      };
      if(arrList[i].status != 4){  //只有status==4(已挂失)才能取消挂失
        cancelLossBtn = true;
      };
    }
  }else{
    toForeverBtn = false;
    toActivationBtn = false;
    lossBtn = false;
    cancelLossBtn = false;
  }
  //四个按钮状态
  $("#toForever").prop("disabled",toForeverBtn);
  $("#toActivation").prop("disabled",toActivationBtn);
  $("#loss").prop("disabled",lossBtn);
  $("#cancelLoss").prop("disabled",cancelLossBtn);
}
```

### 2.formatter的问题
我的项目中有个这样的需求，就是接口会返回类型type和状态status，返回的是数值，但是不会返回对应的名称，所以需要我自己根据返回的数值显示出对应的名称，于是我查了一下API，发现formatter可以实现，于是我就这样写：

```javascript
colModel:[
    {
        label:"激活类型",
        name: "type",
        width: 100,
        formatter: function(cellValue, options, rowObject){
            switch(cellValue){
                case 0:
                    return "AAA";
                    break;
                case 1:
                    return "BBB";
                    break;
           }
        }
    }
]
```

status也采用了同样的原理，结果问题来了，加了formatter以后，把原来的type和status都赋值成了文本内容，就是formatter里return的值，但是我之前的控制按钮状态的方法是根据type和status的数值来判断的，结果现在判断就不生效了，后来发现了一个解决办法，就是不直接改变type的值，而是增加一个参数typeName，让type列隐藏（hidden:true），然后给typeName列写formatter，所以说jqGrid还是很灵活的，代码如下，具体代码请查看我的项目源代码

```javascript
colModel:[
    {
        label:"激活类型",
        name: "type",
        width: 100,
        hidden: true
    },
    {
        label:"激活类型",
        name: "typeName",
        width: 100,
        formatter: function(cellValue, options, rowObject){
            switch(rowObject.type){
                case 0:
                    return "AAA";
                    break;
                case 1:
                    return "BBB";
                    break;
           }
        }
    }
]
```

formatter有三个参数cellValue(当前cell的值)，options(该cell的options设置，包括{rowId, colModel,pos,gid})，rowObject(当前cell所在row的值，如{ id=1, name="name1", price=123.1, ...})，所以我可以根据rowObject.type来确定typeName的值，statusName的值也采用同样的原理，详情js请见js/index.js。

### 3.formatter定义点击按钮的问题

我在每一行定义了两个按钮"记录"和"查看"，代码如下：

```javascript
colModel:[
    {
    label: "操作",
    name: "operate",
    width: 100,
    formatter: function (value, grid, rows, state) { 
        return "<a href=\"#\" style=\"color:#f60\" data-toggle=\"modal\" data-target=\"#history-modal\"  onclick=\"historyRecords(" + rows.id + ")\">记录</a><a href=\"#\" style=\"color:#f60;margin-left:10px;\" data-toggle=\"modal\" data-target=\"#detail-modal\" onclick=\"detail(" + rows.id + ")\">查看</a>"
    						   }
    }
]
```
这样就定义了两个按钮，并且在js里为这两个按钮定义了两个函数，但是我无意中发现，使用a标签定义这两个按钮是没有问题的，但是有的同学不经意间使用了span标签来定义这两个按钮，并且给span加了cursor:pointer，虽然这样看起来跟a标签没有什么区别，但是使用span标签的过程中出现了一个bug，就是我点击按钮的时候按钮所在的行会被选中或取消选中，本来我点击按钮是要打开弹窗的，并不想选中一行，希望点击一行中除了按钮以外的位置再选中一行，**所以注意：要使用a标签来定义按钮，而不是span标签。**

### 4.jqGrid获取数据信息

#### 4-1 获取分页信息

获取返回的当前页，每页数，总页数，返回的总记录数的代码如下：

```javascript
var re_records = $("#gridTable").getGridParam('records');  //获取返回的记录数 

var re_page = $("#gridTable").getGridParam('page');  //获取返回的当前页

var re_rowNum= $("#gridTable").getGridParam('rowNum');  //获取每页数  

var re_total= $("#gridTable").getGridParam('lastpage');  //获取总页数
```

#### 4-2 获取选中的行的数据

```javascript
//获取选择一行的id，如果你选择多行，那下面的id是最后选择的行的id
var id=$("#gridTable").jqGrid("getGridParam","selrow");

//获取选择多行的id，并返回一个id数组
var ids=$("#gridTable").jqGrid("getGridParam","selarrrow");

//如果想获取选择的行的数据，只要传入rowId即可
var rowData = $("#gridTable").jqGrid("getRowData",rowId);
```

#### 4-3 设置选中行

```javascript
//选中id为rowId的某一行，不刷新列表
$("#gridTable").jqGrid("setSelection", rowId);  

//取消选中id为rowId的某一行，不刷新列表
$("#gridTable").jqGrid("resetSelection", rowId);  
```

### 5.jqGrid treeGrid（树）

相信用过jqGrid的同学都用到过它的树(treeGrid)，将初始化参数treeGrid设置为true，在使用treeGrid的过程中，我在网上看好多人都提问同样一个奇葩的问题，我也遇到了这个问题，最终各种试验，找到了解决办法，demo请查看tree.html，下面来分享一下：

接口返回的expanded值为false时，tree应该是默认收起的状态，但是实际却是默认展开的状态，这是怎么回事呢，我反复试验，最后发现竟然原因是这样：

这是有问题的json数据：

```javascript
{
    "rows":[
        {"id":"1","name":"一级菜单","parentMenuId":null,"level":"0","isLeaf":false,"expanded":false,"loaded":true},
        {"id":"2","name":"二级菜单1","parentMenuId":1,"level":"1","isLeaf":false,"expanded":false,"loaded":true},
        {"id":"3","name":"三级菜单1","parentMenuId":2,"level":"2","isLeaf":true,"expanded":false,"loaded":true},
        {"id":"4","name":"三级菜单2","parentMenuId":2,"level":"2","isLeaf":true,"expanded":false,"loaded":true},
        {"id":"5","name":"二级菜单2","parentMenuId":1,"level":"1","isLeaf":false,"expanded":false,"loaded":true},
        {"id":"6","name":"三级菜单1","parentMenuId":5,"level":"2","isLeaf":true,"expanded":false,"loaded":true},
        {"id":"7","name":"三级菜单2","parentMenuId":5,"level":"2","isLeaf":true,"expanded":false,"loaded":true}
    ]
}
```

下面是改好的json数据：
```javascript
{
    "rows":[
        {"id":"1","name":"一级菜单","parentMenuId":null,"level":"0","isLeaf":false,"expanded":false,"loaded":true},
        {"id":"2","name":"二级菜单1","parentMenuId":"1","level":"1","isLeaf":false,"expanded":false,"loaded":true},
        {"id":"3","name":"三级菜单1","parentMenuId":"2","level":"2","isLeaf":true,"expanded":false,"loaded":true},
        {"id":"4","name":"三级菜单2","parentMenuId":"2","level":"2","isLeaf":true,"expanded":false,"loaded":true},
        {"id":"5","name":"二级菜单2","parentMenuId":"1","level":"1","isLeaf":false,"expanded":false,"loaded":true},
        {"id":"6","name":"三级菜单1","parentMenuId":"5","level":"2","isLeaf":true,"expanded":false,"loaded":true},
        {"id":"7","name":"三级菜单2","parentMenuId":"5","level":"2","isLeaf":true,"expanded":false,"loaded":true}
    ]
}
```

发现什么区别了吗？原来只需要把parentMenuId的数值改成跟id一样是字符串的形式就好了，是不是很神奇呢？详情demo请查看tree.html和data/treetest.json。


----------
参考文章链接

http://blog.mn886.net/jqGrid/
