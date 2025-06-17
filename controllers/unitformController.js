const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview');
const PromptSet = require('../models/unit_models/promptset');
const Template = require('../models/unit_models/template');
const Exercise = require('../models/unit_models/exercise');
const MicroStudy = require('../models/unit_models/microstudy');
const MicroCourse = require('../models/unit_models/microcourse');
const { uploader } = require('../utils/cloudinary');
const { Readable } = require('stream');


console.log('unitFormController loaded');



// Environment check for development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Helper function to safely get CSRF token
function getCsrfToken(req) {
  return req.csrfToken ? req.csrfToken() : null;
}

const createGetFormHandler = (unitType, viewPath) => (req, res) => {
  console.log(`🛡 Rendering ${unitType} form. CSRF available:`, typeof req.csrfToken === 'function');

    try {
        const mainTopics = [
            'Career Development in Technical Services',
            'Soft Skills in Technical Environments',
            'Project Management',
            'Business Development in Technical Services',
            'Proposal Management',
            'Proposal Strategy',
            'Storytelling in Technical Marketing',
            'Client Experience',
            'Social Media, Advertising, and Other Mysteries',
            'Emotional Intelligence',
            'The Pareto Principle or 80/20',
            'Diversity and Inclusion in Consulting',
            'People Before Profit',
            'Non-Technical Roles in Technical Environments',
            'Leadership in Technical Services',
            'The Advantage of Failure',
            'Social Entrepreneurship',
            'Employee Experience',
            'Project Management Software',
            'CRM Platforms',
            'Client Feedback Software',
            'Workplace Culture',
            'Mental Health in Consulting Environments',
            'Remote and Hybrid Work',
            'Four Day Work Week',
            'The Power of Play in the Workplace',
            'Team Building in Consulting',
            'AI in Consulting',
            'AI in Project Management',
            'AI in Learning',
        ];

        res.render(`unit_form_views/${viewPath}`, {
          layout: 'unitformlayout',
          unitType,
          mainTopics,
          data: {},
          csrfToken: getCsrfToken(req),
      });
    } catch (error) {
        console.error(`Error rendering form for ${unitType}:`, error);
        res.status(500).send(`Error rendering form for ${unitType}.`);
    }
};

const unitFormController = {
    // Explicitly created handlers
    getArticleForm: createGetFormHandler('article', 'form_article'),
    getVideoForm: createGetFormHandler('video', 'form_video'),
    getInterviewForm: createGetFormHandler('interview', 'form_interview'),
    getPromptForm: createGetFormHandler('promptset', 'form_promptset'),
    getExerciseForm: createGetFormHandler('exercise', 'form_exercise'),
    getTemplateForm: createGetFormHandler('template', 'form_template'),
    getMicroCourseForm: createGetFormHandler('microcourse', 'form_microcourse'),
    getMicroStudyForm: createGetFormHandler('microstudy', 'form_microstudy'),

    // POST Handlers with Validation
    submitUnit: (Model, unitType, validateFunction) => async (req, res) => {
        

        try {
            console.log(`Received POST request for ${unitType}:`, req.body);
    
            const errors = validateFunction(req.body);
            if (errors.length > 0) {
                return res.render(`unit_form_views/form_${unitType}`, {
                    layout: 'unitformlayout',
                    data: req.body,
                    errors,
                    csrfToken: isDevelopment ? null : req.csrfToken(),
                });
            }
    
            const unitData = {
                author: {
                    id: req.user._id,
                },
                topic: req.body.topic || 'No topic specified', 
                ...req.body,
            };
    
            const unit = req.body._id
                ? await Model.findByIdAndUpdate(req.body._id, unitData, { new: true })
                : await Model.create(unitData);
    
            console.log(`Saved ${unitType} successfully:`, unit);
    
            res.render('unit_form_views/unit_success', {
                layout: 'unitformlayout',
                unitType,
                unit,
                csrfToken: isDevelopment ? null : req.csrfToken(),
            });
        } catch (error) {
            console.error(`${unitType} submission error:`, error);
            res.status(500).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Error',
                errorMessage: 'An error occurred while submitting the unit.',
            });
        }
    },
    

    // Success Page Handler
    showSuccessPage: async (req, res) => {

        const { unitType, id, error } = req.query;

        try {
            let unit = null;
            if (id) {
                const Model = {
                    article: Article,
                    video: Video,
                    interview: Interview,
                    promptset: PromptSet,
                    template: Template,
                    exercise: Exercise,
                    microstudy: MicroStudy,
                    microcourse: MicroCourse,
                }[unitType];

                unit = await Model.findById(id);
                console.log(`Fetched ${unitType} for success page:`, unit);
            }

            res.render('unit_form_views/unit_success', {
                layout: 'unitformlayout',
                unitType,
                unit,
                error,
                csrfToken: isDevelopment ? null : req.csrfToken(),
            });
        } catch (fetchError) {
            console.error(`Error fetching ${unitType} details for success page:`, fetchError);
            res.status(500).render('unit_form_views/error', {
                layout: 'unitformlayout',
                unitType,
                error: 'Unable to fetch unit details.',
                csrfToken: isDevelopment ? null : req.csrfToken(),
            });
        }
    },







    submitArticle: async (req, res) => {

        try {
            if (!isDevelopment && !req.body._csrf) {
                console.warn('CSRF validation failed.');
                throw new Error('CSRF token is missing or invalid.');
            }

            const { _id, ...articleData } = req.body;

            if (!req.user || !req.user._id) {
                throw new Error('User is not authenticated or missing user ID.');
            }

            const booleanFields = [
                'clarify_topic',
                'produce_deliverables',
                'new_ideas',
                'include_results',
                'permission',
            ];
            booleanFields.forEach((field) => {
                articleData[field] = req.body[field] === 'on';
            });

            articleData.author = {
                id: req.user._id,
            };

            let article;
            if (_id) {
                article = await Article.findByIdAndUpdate(_id, articleData, { new: true, runValidators: true });
                console.log(`Article with ID ${_id} updated successfully.`);
            } else {
                article = new Article(articleData);
                await article.save();
                console.log('New article created successfully.');
            }

            res.render('unit_form_views/unit_success', {
                layout: 'unitformlayout',
                unitType: 'article',
                unit: article,
                csrfToken: isDevelopment ? null : req.csrfToken(),
            });
        } catch (error) {
            console.error('Error submitting article:', error);
            res.status(500).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Error',
                errorMessage: error.message || 'An error occurred while submitting the article.',
            });
        }
    },


    
    

    submitVideo: async (req, res) => {

        try {
          if (process.env.NODE_ENV === 'production' && !req.body._csrf) {
            throw new Error('CSRF token is missing or invalid.');
        }
    
            const { _id, ...videoData } = req.body; // Extract _id and other form data
    
            // Convert checkbox values from "on" to true
            const booleanFields = ['clarify_topic', 'produce_deliverables', 'new_ideas', 'engaging', 'permission'];
            booleanFields.forEach((field) => {
                videoData[field] = req.body[field] === 'on';
            });
    
            // Automatically include author information
            videoData.author = {
                id: req.user._id, // Automatically populate the logged-in user's ID
            };
    
            let video;
            if (_id) {
                // Edit existing video
                video = await Video.findByIdAndUpdate(
                    _id,
                    videoData,
                    { new: true, runValidators: true } // Ensure validators are run
                );
                console.log(`Video with ID ${_id} updated successfully.`);
            } else {
                // Create new video
                video = new Video(videoData);
                await video.save();
                console.log('New video created successfully.');
            }
    
            res.render('unit_form_views/unit_success', {
              layout: 'unitformlayout',
              unitType: 'video',
              unit: video,
              csrfToken: getCsrfToken(req),
          });
        } catch (error) {
            console.error('Error submitting video:', error);
            res.status(500).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Error',
                errorMessage: 'An error occurred while submitting the video.',
            });
        }
    },
    

    



    submitInterview: async (req, res) => {

        try {
            if (!isDevelopment && !req.body._csrf) {
                throw new Error('CSRF token is missing or invalid.');
            }
    
            const { _id, ...interviewData } = req.body; // Extract _id and other form data
    
            // Convert checkbox values from "on" to true
            const booleanFields = ['clarify_topic', 'produce_deliverables', 'new_ideas', 'engaging', 'permission'];
            booleanFields.forEach((field) => {
                interviewData[field] = req.body[field] === 'on';
            });
    
            // Automatically include author information
            interviewData.author = {
                id: req.user._id, // Automatically populate the logged-in user's ID
            };
    
            let interview;
            if (_id) {
                // Edit existing interview
                interview = await Interview.findByIdAndUpdate(
                    _id,
                    interviewData,
                    { new: true, runValidators: true } // Ensure validators are run
                );
                console.log(`Interview with ID ${_id} updated successfully.`);
            } else {
                // Create new interview
                interview = new Interview(interviewData);
                await interview.save();
                console.log('New interview created successfully.');
            }
    
            res.render('unit_form_views/unit_success', {
                layout: 'unitformlayout',
                unitType: 'interview',
                unit: interview,
                csrfToken: isDevelopment ? null : req.csrfToken(),
            });
        } catch (error) {
            console.error('Error submitting interview:', error);
            res.status(500).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Error',
                errorMessage: 'An error occurred while submitting the interview.',
            });
        }
    },
    
    getPromptForm: async (req, res) => {

        try {
          console.log('New prompt set form requested');
      
          // Load existing data if editing; otherwise, use an empty object
          const existingData = req.promptSet || {};
      
          // Retrieve any selected badge from the session (if a badge was chosen)
          const selectedBadge = req.session.selectedBadge || {};
      
          // Attach the badge to the data (so the form will display it)
          existingData.badge = selectedBadge;
      
          // Clear the badge from the session so that a new blank form won’t pre-fill a badge
          req.session.selectedBadge = null;
      
          res.render('unit_form_views/form_promptset', {
            layout: 'unitformlayout',
            data: existingData, // Pre-filled for editing, empty for new
            mainTopics: [
              'Career Development in Technical Services',
              'Soft Skills in Technical Environments',
              'Project Management',
              'Business Development in Technical Services',
              'Proposal Management',
              'Proposal Strategy',
              'Storytelling in Technical Marketing',
              'Client Experience',
              'Social Media, Advertising, and Other Mysteries',
              'Emotional Intelligence',
              'The Pareto Principle or 80/20',
              'Diversity and Inclusion in Consulting',
              'People Before Profit',
              'Non-Technical Roles in Technical Environments',
              'Leadership in Technical Services',
              'The Advantage of Failure',
              'Social Entrepreneurship',
              'Employee Experience',
              'Project Management Software',
              'CRM Platforms',
              'Client Feedback Software',
              'Workplace Culture',
              'Mental Health in Consulting Environments',
              'Remote and Hybrid Work',
              'Four Day Work Week',
              'The Power of Play in the Workplace',
              'Team Building in Consulting',
              'AI in Consulting',
              'AI in Project Management',
              'AI in Learning'
            ],
            secondaryTopics: [
              'Career Development in Technical Services',
              'Soft Skills in Technical Environments',
              'Project Management',
              'Business Development in Technical Services',
              'Proposal Management',
              'Proposal Strategy',
              'Storytelling in Technical Marketing',
              'Client Experience',
              'Social Media, Advertising, and Other Mysteries',
              'Emotional Intelligence',
              'The Pareto Principle or 80/20',
              'Diversity and Inclusion in Consulting',
              'People Before Profit',
              'Non-Technical Roles in Technical Environments',
              'Leadership in Technical Services',
              'The Advantage of Failure',
              'Social Entrepreneurship',
              'Employee Experience',
              'Project Management Software',
              'CRM Platforms',
              'Client Feedback Software',
              'Workplace Culture',
              'Mental Health in Consulting Environments',
              'Remote and Hybrid Work',
              'Four Day Work Week',
              'The Power of Play in the Workplace',
              'Team Building in Consulting',
              'AI in Consulting',
              'AI in Project Management',
              'AI in Learning'
            ],
            characteristics: [
              'educational',
              'motivational',
              'provocative',
              'fun',
              'hilarious',
              'silly',
              'competitive',
              'restorative',
              'energizing',
              'relationship-building',
              'team building',
              'stress-relieving',
              'insightful',
              'calming',
              'reassuring',
              'encouraging',
              'creative',
              'imaginative',
              'heart-warming',
              'other'
            ],
            frequencies: ['daily', 'weekly', 'monthly', 'quarterly'],
            csrfToken: isDevelopment ? null : req.csrfToken(),
          });
        } catch (error) {
          console.error('Error loading new prompt set form:', error);
          res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while loading the form.',
          });
        }
      },
      
    
    
    

      submitPromptSet: async (req, res) => {

        try {
          if (!isDevelopment && !req.body._csrf) {
            console.error('CSRF validation failed: CSRF token is missing or invalid.');
            throw new Error('CSRF token is missing or invalid.');
          }
      
          const { _id, ...promptSetData } = req.body;
          console.log('Raw request body:', req.body);
      
          // Convert checkbox values from "on" to true
          const booleanFields = ['clarify_topic', 'topics_and_enlightenment', 'challenge', 'instructions', 'time', 'permission'];
          booleanFields.forEach((field) => {
            promptSetData[field] = req.body[field] === 'on';
          });
          console.log('Converted boolean fields:', booleanFields.reduce((obj, field) => {
            obj[field] = promptSetData[field];
            return obj;
          }, {}));
      
          // Transform badge fields into a nested object, if provided
          if (promptSetData["badge.image"] || promptSetData["badge.name"]) {
            promptSetData.badge = {
              image: promptSetData["badge.image"],
              name: promptSetData["badge.name"]
            };
            delete promptSetData["badge.image"];
            delete promptSetData["badge.name"];
          }
      
          // Automatically include author information
          if (req.user && req.user._id) {
            promptSetData.author = { id: req.user._id };
            console.log('Author ID set to:', req.user._id);
          } else {
            console.error('User information is missing or incomplete in the request.');
            throw new Error('Author ID is required but missing.');
          }
      
          // Extract prompts and headlines from req.body (for indices 1 to 20)
          for (let i = 1; i <= 20; i++) {
            promptSetData[`prompt_headline${i}`] = req.body[`prompt_headline${i}`] || "";
            promptSetData[`Prompt${i}`] = req.body[`Prompt${i}`] || "";
          }
      
          console.log('Processed prompt set data:', promptSetData);
      
          let promptSet;
          if (_id) {
            console.log(`Updating existing prompt set with ID: ${_id}`);
            promptSet = await PromptSet.findByIdAndUpdate(
              _id,
              promptSetData,
              { new: true, runValidators: true }
            );
            if (!promptSet) {
              console.error(`No prompt set found with ID: ${_id}`);
              throw new Error(`Failed to update: No prompt set found with ID ${_id}.`);
            }
            console.log(`Prompt set with ID ${_id} updated successfully.`);
          } else {
            console.log('Creating new prompt set.');
            promptSet = new PromptSet(promptSetData);
            try {
              await promptSet.save();
              console.log('New prompt set created successfully.');
            } catch (saveError) {
              console.error('Error saving new prompt set:', saveError);
              throw saveError;
            }
          }
      
          res.render('unit_form_views/unit_success', {
            layout: 'unitformlayout',
            unitType: 'promptset',
            unit: promptSet,
            csrfToken: isDevelopment ? null : req.csrfToken(),
          });
        } catch (error) {
          console.error('Error stack:', error.stack);
          res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: error.message || 'An error occurred while submitting the prompt set.',
          });
        }
      },
      
      
      submitExercise: async (req, res) => {
        try {
          if (!isDevelopment && !req.body._csrf) {
            throw new Error('CSRF token is missing or invalid.');
          }
    
          const { _id, ...exerciseData } = req.body;
    
          const booleanFields = [
            'clarify_topic',
            'topics_and_enlightenment',
            'challenge',
            'instructions',
            'time',
            'permission'
          ];
          booleanFields.forEach((field) => {
            exerciseData[field] = req.body[field] === 'on';
          });
    
          exerciseData.author = { id: req.user._id };
    
          if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => {
              return new Promise((resolve, reject) => {
                const stream = uploader.upload_stream(
                  {
                    folder: 'twennie_exercises',
                    resource_type: 'raw',
                    public_id: file.originalname.replace(/\.[^/.]+$/, '')
                  },
                  (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                  }
                );
    
                if (file && file.buffer) {
                  stream.end(file.buffer);
                } else {
                  resolve(null);
                }
              });
            });
    
            const documentUrls = (await Promise.all(uploadPromises)).filter(Boolean);
            exerciseData.document_uploads = documentUrls;
          }
    
          let exercise;
          if (_id) {
            exercise = await Exercise.findByIdAndUpdate(_id, exerciseData, {
              new: true,
              runValidators: true
            });
          } else {
            exercise = new Exercise(exerciseData);
            await exercise.save();
          }
    
          res.render('unit_form_views/unit_success', {
            layout: 'unitformlayout',
            unitType: 'exercise',
            unit: exercise,
            csrfToken: isDevelopment ? null : req.csrfToken()
          });
    
        } catch (error) {
          console.error('Error submitting exercise:', error);
          res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while submitting the exercise.'
          });
        }
      },
    
      submitTemplate: async (req, res) => {
        try {
          if (!isDevelopment && !req.body._csrf) {
            throw new Error('CSRF token is missing or invalid.');
          }
    
          const { _id, ...templateData } = req.body;
    
          const booleanFields = [
            'clarify_topic',
            'produce_deliverables',
            'new_ideas',
            'engaging',
            'file_format',
            'permission'
          ];
          booleanFields.forEach((field) => {
            templateData[field] = req.body[field] === 'on';
          });
    
          if (!req.files || req.files.length === 0) {
            return res.status(400).render('unit_form_views/error', {
              layout: 'unitformlayout',
              title: 'Missing File',
              errorMessage: 'Please upload your template document before submitting.'
            });
          }
    
          const uploadedFiles = [];
    
          for (const file of req.files) {
            const fileUploadPromise = new Promise((resolve, reject) => {
              const stream = uploader.upload_stream(
                {
                  resource_type: 'raw',
                  folder: 'twennie_templates'
                },
                (error, result) => {
                  if (error) return reject(new Error('Cloudinary upload failed: ' + error.message));
                  resolve({
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    url: result.secure_url
                  });
                }
              );
    
              const readableStream = new Readable();
              readableStream.push(file.buffer);
              readableStream.push(null);
              readableStream.pipe(stream);
            });
    
            const uploaded = await fileUploadPromise;
            uploadedFiles.push(uploaded);
          }
    
          templateData.documentUploads = uploadedFiles;
          templateData.author = { id: req.user._id };
    
          let template;
          if (_id) {
            template = await Template.findByIdAndUpdate(_id, templateData, {
              new: true,
              runValidators: true
            });
          } else {
            template = new Template(templateData);
            await template.save();
          }
    
          res.render('unit_form_views/unit_success', {
            layout: 'unitformlayout',
            unitType: 'template',
            unit: template,
            csrfToken: isDevelopment ? null : req.csrfToken()
          });
    
        } catch (error) {
          console.error('Error submitting template:', error);
          res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while submitting the template.'
          });
        }
      }
    };
      
      module.exports = unitFormController;
      


