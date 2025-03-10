import commentModel from "../Model/Comment.model.js";
export function addComment(req,res){
            const {content,username,Video_id_Num}=req.body;
            const new_comment=new commentModel({
                 content,
                 username,
                 Video_id_Num
            })
            new_comment.save().then((data)=>{
                if(!data){
                    res.status(404).send('No comments found');
                }
                else{
                    res.status(200).send({message:'Comments added'})
                }
            })

}
export function getComment(req, res) {
    console.log("Query Params:", req.query);
    
    const { Video_id_Num } = req.query;  
    // console.log(req.query)
    if (!Video_id_Num) {
        return res.status(400).json({ message: "Video_id_Num is required" });
    }

    commentModel.find({ Video_id_Num })  
        .then((data) => {
            if (!data || data.length === 0) {
                res.status(404).json({ message: "No comments found" });
            } else {
                res.json(data);
            }
        })
        .catch((err) => {
            console.error("Database Error:", err);
            res.status(503).json({ message: err.message });
        });
}

export function deleteComment(req,res){
    const id=req.params.id;
    commentModel.findByIdAndDelete(id).then((data)=>{
              if(!data){
                return res.status(404).json({message:'Comment not found'})
              }
              return res.status(200).json({message:'Comment deleted successfully'})
    }).catch((err)=>{
        res.status(503).send({message:err.message})
    })

}
export function editComment(req,res){
    const id=req.params.id;
    const {content}=req.body;
    commentModel.findByIdAndUpdate(
        id,
        {content},
        {new:true,runValidators:true}
    ).then((data)=>{
           if(!data){
             return res.status(404).send({message:'No data found'});
           }
           return res.status(200).json({message:{data}})
    }).catch((err)=>{
        res.status(503).send({message:'Internal server error'})
    })
}