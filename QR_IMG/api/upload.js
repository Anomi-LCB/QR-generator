// GitHub API와 통신하기 위한 라이브러리입니다.
const { Octokit } = require("@octokit/rest");

// Vercel 서버리스 함수의 기본 형식입니다.
module.exports = async (req, res) => {
    // POST 요청이 아니면 에러를 반환합니다.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. 웹페이지에서 보낸 이미지 데이터(base64)와 파일명을 받습니다.
        const { image, name } = req.body;
        if (!image || !name) {
            return res.status(400).json({ error: 'Image data and name are required.' });
        }
        
        // 데이터 URI 스킴(예: 'data:image/png;base64,') 부분을 제거하여 순수 데이터만 남깁니다.
        const content = image.split(';base64,').pop();

        // 2. Vercel 환경 변수에서 GitHub 토큰을 안전하게 불러옵니다.
        // 이 코드는 Vercel 서버에서만 작동하며, 토큰이 외부로 노출되지 않습니다.
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        // !!! 중요: 아래 값을 본인의 정보로 반드시 수정해주세요 !!!
        const owner = 'YOUR_GITHUB_USERNAME'; // 본인 GitHub 유저네임
        const repo = 'YOUR_REPOSITORY_NAME';  // 이미지를 저장할 저장소 이름
        
        // 파일을 저장할 경로와 이름입니다. (예: 'uploads/1681300000-image.png')
        // 파일 이름 앞에 현재 시간을 붙여 중복을 방지합니다.
        const path = `uploads/${Date.now()}-${name}`;
        
        // 3. GitHub API를 호출하여 저장소에 파일을 생성(업로드)합니다.
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `feat: Upload image ${name} via QR-Generator`, // 커밋 메시지
            content: content, // base64로 인코딩된 이미지 데이터
            encoding: 'base64',
        });

        // 4. 업로드 성공 시, 생성된 파일의 고유 URL을 웹페이지에 돌려줍니다.
        res.status(200).json({ url: data.content.download_url });

    } catch (error) {
        // 5. 오류 발생 시, 에러 메시지를 돌려줍니다.
        console.error(error);
        res.status(500).json({ error: 'Failed to upload image to GitHub.' });
    }
};